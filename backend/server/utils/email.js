import fs from 'fs/promises'
import path from 'path'
import nodemailer from 'nodemailer'
import handlebars from 'handlebars'
import juice from 'juice'
import { htmlToText } from 'html-to-text'
import { env } from '../config/env.js'
import { logger } from './logger.js'

const templatesDir = path.resolve('./server/views/emails')

const createSmtpTransporter = () => {
  const service = env.emailService || process.env.EMAIL_SERVICE
  const user = env.smtp.user
  const pass = env.smtp.pass

  if (env.smtp.host && user && pass) {
    return nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port || 587,
      secure: Number(env.smtp.port) === 465,
      auth: { user, pass },
    })
  }

  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass },
    })
  }

  return null
}

const transporter = createSmtpTransporter()

// Log initialization state for monitoring
logger.info('Email helper initialized', {
  smtpConfigured: Boolean((env.smtp.host && env.smtp.user && env.smtp.pass) || (env.emailService && env.smtp.user && env.smtp.pass)),
  smtpHost: env.smtp.host,
  smtpService: env.emailService,
  brevoConfigured: Boolean(process.env.BREVO_API_KEY),
})

async function loadTemplate(name) {
  const htmlPath = path.join(templatesDir, `${name}.html`)
  const txtPath = path.join(templatesDir, `${name}.txt`)
  let html = ''
  let text = ''
  try {
    html = await fs.readFile(htmlPath, 'utf8')
  } catch (e) {
    // ignore
  }
  try {
    text = await fs.readFile(txtPath, 'utf8')
  } catch (e) {
    // ignore
  }
  return { html, text }
}

export async function renderTemplate(name, context = {}) {
  const { html: rawHtml, text: rawText } = await loadTemplate(name)
  const compiledHtml = rawHtml ? handlebars.compile(rawHtml)(context) : ''
  const inlined = compiledHtml ? juice(compiledHtml) : ''
  const text = rawText ? handlebars.compile(rawText)(context) : (inlined ? htmlToText(inlined) : '')
  return { html: inlined, text }
}

export async function sendEmail({ to, subject, template = 'welcome', context = {}, from } = {}) {
  if (!to) throw new Error('Missing `to` address')
  const sender = from || env.smtp.from || env.EMAIL_FROM || env.adminEmail || 'no-reply@localhost'
  const { html, text } = await renderTemplate(template, context)
  const useBrevo = Boolean(process.env.BREVO_API_KEY)
  const useSmtp = Boolean(transporter)

  if (useBrevo) {
    const payload = {
      sender: { email: sender },
      to: [typeof to === 'string' ? { email: to } : to],
      subject,
      htmlContent: html,
      textContent: text,
    }

    logger.info('Sending email via Brevo', { to, subject, template })
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        logger.error('Brevo send failed', { to, status: res.status, body: data })
        throw new Error(data?.message || 'Brevo send failed')
      }
      logger.info('Brevo send success', { to, data })
      return { provider: 'brevo', info: data }
    } catch (err) {
      logger.error('Brevo send error', { to, message: err?.message, stack: err?.stack })
      if (!useSmtp) throw err
      logger.warn('Falling back to SMTP after Brevo failure', { to, error: err?.message })
    }
  }

  if (useSmtp) {
    logger.info('Sending email via SMTP', { to, subject, template, from: sender })
    try {
      const info = await transporter.sendMail({
        from: sender,
        to: typeof to === 'string' ? to : (to.email || JSON.stringify(to)),
        subject,
        html,
        text,
      })
      logger.info('SMTP send success', { to, messageId: info?.messageId, response: info?.response })
      return { provider: 'smtp', info }
    } catch (err) {
      logger.error('SMTP send failed', { to, message: err?.message, stack: err?.stack })
      throw err
    }
  }

  logger.error('No email provider configured', { smtp: useSmtp, brevo: useBrevo })
  throw new Error('No email provider configured (SMTP credentials or BREVO_API_KEY required)')
}

export default { renderTemplate, sendEmail }


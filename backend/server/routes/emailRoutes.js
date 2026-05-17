import express from 'express'
import { sendEmail } from '../utils/email.js'
import { sendSuccess, sendError } from '../utils/response.js'

const router = express.Router()

// POST /api/email/send-test
router.post('/send-test', async (req, res) => {
    try {
        const { to, subject, template, context } = req.body
        if (!to) return sendError(res, 'Missing `to` in request body', 400)
        const result = await sendEmail({ to, subject: subject || 'Test email from CampusThread', template: template || 'welcome', context: context || {} })
        return sendSuccess(res, { message: 'Email sent', data: result })
    } catch (err) {
        return sendError(res, err?.message || 'Failed to send email', 500)
    }
})

export default router

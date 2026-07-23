import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coins, Gamepad2, Gift, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import Navbar from '../components/Navbar'
import NotificationToast from '../components/NotificationToast'
import { useTheme } from '../context/ThemeContext'
import { useNotification } from '../hooks/useNotification'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const NAV_LINKS = [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/explore', label: 'Explore' },
    { path: '/game', label: 'Game' },
    { path: '/cart', label: 'Cart' },
    { path: '/favorites', label: 'Favorites' },
]

const createObstacle = (id, x) => ({
    id,
    x,
    type: Math.random() > 0.5 ? 'barrier' : 'cone',
})

const createCollectible = (id, x) => ({
    id,
    x,
    type: Math.random() > 0.5 ? 'voucher' : 'coin',
})

const JUMP_HEIGHT = 58
const MIN_OBSTACLE_GAP = 180

export default function Game() {
    const { theme } = useTheme()
    const { notifications } = useNotification()
    const isDark = theme === 'dark'

    const [stats, setStats] = useState({ coins: 0, vouchers: 0 })
    const [leaderboard, setLeaderboard] = useState([])
    const audioContextRef = useRef(null)
    const [game, setGame] = useState({
        running: false,
        over: false,
        paused: false,
        jumpHeight: 0,
        obstacles: [],
        collectibles: [],
        score: 0,
        collectedCoins: 0,
        collectedVouchers: 0,
        reward: null,
        runs: 0,
    })

    useEffect(() => {
        try {
            const savedStats = window.localStorage.getItem('campusthread-runner-stats')
            if (savedStats) {
                const parsedStats = JSON.parse(savedStats)
                if (parsedStats) {
                    setStats({ coins: Number(parsedStats.coins) || 0, vouchers: Number(parsedStats.vouchers) || 0 })
                }
            }

            const savedLeaderboard = window.localStorage.getItem('campusthread-runner-leaderboard')
            if (savedLeaderboard) {
                const parsedLeaderboard = JSON.parse(savedLeaderboard)
                if (Array.isArray(parsedLeaderboard)) {
                    setLeaderboard(parsedLeaderboard)
                }
            }
        } catch {
            // ignore storage issues
        }
    }, [])

    useEffect(() => {
        window.localStorage.setItem('campusthread-runner-stats', JSON.stringify(stats))
    }, [stats])

    const ensureAudio = () => {
        if (typeof window === 'undefined') return null
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (!AudioContext) return null
            audioContextRef.current = new AudioContext()
        }

        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
        }

        return audioContextRef.current
    }

    const playSound = (type) => {
        const ctx = ensureAudio()
        if (!ctx) return

        const now = ctx.currentTime
        const oscillator = ctx.createOscillator()
        const gain = ctx.createGain()

        oscillator.connect(gain)
        gain.connect(ctx.destination)

        if (type === 'jump') {
            oscillator.type = 'triangle'
            oscillator.frequency.setValueAtTime(720, now)
            oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.12)
        } else if (type === 'collect') {
            oscillator.type = 'sine'
            oscillator.frequency.setValueAtTime(860, now)
            oscillator.frequency.exponentialRampToValueAtTime(1180, now + 0.12)
        } else {
            oscillator.type = 'square'
            oscillator.frequency.setValueAtTime(280, now)
            oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.18)
        }

        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)

        oscillator.start(now)
        oscillator.stop(now + 0.2)
    }

    useEffect(() => {
        if (!game.running || game.paused || game.over) return

        const interval = window.setInterval(() => {
            setGame((prev) => {
                if (!prev.running || prev.paused || prev.over) return prev

                let nextJumpHeight = prev.jumpHeight > 0 ? prev.jumpHeight - 4 : 0
                let nextObstacles = prev.obstacles
                    .map((obstacle) => ({ ...obstacle, x: obstacle.x - 8 }))
                    .filter((obstacle) => obstacle.x > -60)
                let nextCollectibles = prev.collectibles
                    .map((item) => ({ ...item, x: item.x - 7 }))
                    .filter((item) => item.x > -60)

                const shouldSpawnObstacle = nextObstacles.length === 0 || nextObstacles[nextObstacles.length - 1].x < MIN_OBSTACLE_GAP
                if (shouldSpawnObstacle && Math.random() > 0.45) {
                    nextObstacles = [...nextObstacles, createObstacle(Date.now() + Math.random(), 320)]
                }

                if (prev.score > 16 && Math.random() > 0.7) {
                    nextCollectibles = [...nextCollectibles, createCollectible(Date.now() + Math.random(), 320)]
                }

                let collectedCoins = prev.collectedCoins
                let collectedVouchers = prev.collectedVouchers

                nextCollectibles = nextCollectibles.filter((item) => {
                    const hit = item.x < 90 && item.x > 38 && nextJumpHeight === 0
                    if (!hit) return true

                    if (item.type === 'coin') {
                        collectedCoins += 1
                        playSound('collect')
                    } else {
                        collectedVouchers += 1
                        playSound('collect')
                    }

                    return false
                })

                const hitObstacle = nextObstacles.some((obstacle) => obstacle.x < 92 && obstacle.x > 40 && nextJumpHeight === 0)
                const nextScore = prev.score + 1

                if (hitObstacle) {
                    playSound('crash')
                    const rewardCoins = Math.max(6, Math.floor(nextScore / 12) + collectedCoins * 2)
                    const rewardVouchers = collectedVouchers > 0 ? 1 : 0

                    return {
                        ...prev,
                        running: false,
                        over: true,
                        jumpHeight: 0,
                        obstacles: nextObstacles,
                        collectibles: nextCollectibles,
                        score: nextScore,
                        collectedCoins,
                        collectedVouchers,
                        reward: { coins: rewardCoins, vouchers: rewardVouchers },
                    }
                }

                return {
                    ...prev,
                    jumpHeight: nextJumpHeight,
                    obstacles: nextObstacles,
                    collectibles: nextCollectibles,
                    score: nextScore,
                    collectedCoins,
                    collectedVouchers,
                    reward: null,
                }
            })
        }, 40)

        return () => window.clearInterval(interval)
    }, [game.running, game.paused, game.over])

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.code === 'Space' || event.code === 'ArrowUp') {
                event.preventDefault()
                jump()
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [game.running, game.over, game.paused])

    const jump = () => {
        if (!game.running || game.over || game.paused) return
        playSound('jump')
        setGame((prev) => ({ ...prev, jumpHeight: prev.jumpHeight > 0 ? prev.jumpHeight : JUMP_HEIGHT }))
    }

    const startGame = () => {
        playSound('jump')
        setGame({
            running: true,
            over: false,
            paused: false,
            jumpHeight: 0,
            obstacles: [],
            collectibles: [],
            score: 0,
            collectedCoins: 0,
            collectedVouchers: 0,
            reward: null,
            runs: game.runs + 1,
        })
    }

    const togglePause = () => {
        if (!game.running || game.over) return
        setGame((prev) => ({ ...prev, paused: !prev.paused }))
    }

    useEffect(() => {
        if (!game.reward) return

        setStats((prev) => ({
            coins: prev.coins + game.reward.coins,
            vouchers: prev.vouchers + game.reward.vouchers,
        }))

        setLeaderboard((prev) => {
            const entry = {
                score: game.score,
                coins: game.reward.coins,
                vouchers: game.reward.vouchers,
                label: `Run ${game.runs}`,
            }

            const updated = [...prev, entry]
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)

            window.localStorage.setItem('campusthread-runner-leaderboard', JSON.stringify(updated))
            return updated
        })
    }, [game.reward, game.score, game.runs])

    const pageClass = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'
    const leaderboardItems = useMemo(() => leaderboard.slice(0, 5), [leaderboard])
    const surfaceClass = isDark
        ? 'border-white/10 bg-slate-900 text-slate-100 shadow-black/30'
        : 'border-slate-200 bg-white text-slate-950 shadow-slate-200/70'
    const mutedText = isDark ? 'text-slate-300' : 'text-slate-600'

    return (
        <div className={cx('min-h-screen transition-colors duration-300', pageClass)}>
            <Navbar links={NAV_LINKS} />
            <NotificationToast notifications={notifications} />

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <section className={cx('overflow-hidden rounded-3xl border shadow-2xl', surfaceClass)}>
                    <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[0.95fr_1.05fr]">
                        <div>
                            <p className={cx('mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.24em]', isDark ? 'border-violet-300/20 bg-violet-300/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700')}>
                                <Gamepad2 size={14} />
                                Campus Dash
                            </p>
                            <h1 className="text-3xl font-black tracking-normal sm:text-4xl">Run, dodge, and collect rewards</h1>
                            <p className={cx('mt-4 max-w-xl text-base leading-7', mutedText)}>
                                Tap or press space to jump through campus obstacles and grab shopping bags, vouchers, and coins. Every run earns you rewards for your next shopping trip.
                            </p>

                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                <div className={cx('rounded-2xl border p-3', isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50')}>
                                    <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
                                        <Coins size={16} /> Coins
                                    </div>
                                    <p className="mt-2 text-2xl font-black">{stats.coins}</p>
                                </div>
                                <div className={cx('rounded-2xl border p-3', isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50')}>
                                    <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
                                        <Gift size={16} /> Vouchers
                                    </div>
                                    <p className="mt-2 text-2xl font-black">{stats.vouchers}</p>
                                </div>
                                <div className={cx('rounded-2xl border p-3', isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-50')}>
                                    <div className="flex items-center gap-2 text-sm font-bold text-violet-700">
                                        <Trophy size={16} /> Runs
                                    </div>
                                    <p className="mt-2 text-2xl font-black">{game.runs}</p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">
                                <button type="button" onClick={startGame} className="inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800">
                                    <Play size={16} /> {game.running ? 'Restart Run' : 'Start Run'}
                                </button>
                                <button type="button" onClick={togglePause} className={cx('rounded-lg border px-4 py-2.5 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
                                    {game.paused ? 'Resume' : 'Pause'}
                                </button>
                                <Link to="/shop" className={cx('rounded-lg border px-4 py-2.5 text-sm font-bold transition', isDark ? 'border-white/10 text-slate-200 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-100')}>
                                    Shop rewards
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className={cx('rounded-3xl border p-3 shadow-inner', isDark ? 'border-white/10 bg-slate-950/70' : 'border-slate-200 bg-slate-100')}>
                                <div className="mb-3 flex items-center justify-between px-1">
                                    <span className="text-sm font-black uppercase tracking-[0.24em] text-violet-700">Live run</span>
                                    <span className="text-sm font-bold">Score {game.score}</span>
                                </div>

                                <div
                                    onPointerDown={jump}
                                    className={cx('relative h-64 overflow-hidden rounded-2xl border', isDark ? 'border-white/10 bg-gradient-to-b from-sky-500/30 to-slate-950' : 'border-slate-200 bg-gradient-to-b from-sky-300 to-slate-100')}
                                    style={{ perspective: '900px' }}
                                >
                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-amber-400/80" />
                                    <div className="absolute inset-x-0 top-0 h-8 bg-white/20" />
                                    <div className="absolute left-4 top-4 h-8 w-16 rounded-full bg-white/25 blur-xl" />
                                    <div className="absolute bottom-16 right-6 h-10 w-10 rounded-full bg-white/20 blur-lg" />
                                    <div className="absolute bottom-10 left-8 h-12 w-12 rounded-2xl bg-violet-700 shadow-[0_12px_24px_rgba(0,0,0,0.24)]" style={{ transform: `translateY(-${game.jumpHeight}px) rotateX(10deg) rotateY(-10deg) scale(1.02)` }} />
                                    <div className="absolute bottom-10 left-8 h-12 w-12 rounded-full bg-white/35" style={{ transform: `translateY(-${game.jumpHeight}px) rotateX(10deg) rotateY(-10deg)` }} />

                                    {game.obstacles.map((obstacle) => (
                                        <div key={obstacle.id} className="absolute bottom-10" style={{ left: `${obstacle.x}px`, transform: 'rotate(-2deg)' }}>
                                            {obstacle.type === 'barrier' ? (
                                                <div className="h-12 w-8 rounded-md border border-slate-800 bg-red-600 shadow-[0_8px_16px_rgba(0,0,0,0.3)]" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-t-full bg-orange-500 shadow-[0_8px_16px_rgba(0,0,0,0.25)]" />
                                            )}
                                        </div>
                                    ))}

                                    {game.collectibles.map((item) => (
                                        <div key={item.id} className="absolute bottom-12" style={{ left: `${item.x}px`, transform: 'rotate(6deg)' }}>
                                            {item.type === 'coin' ? (
                                                <Coins size={24} className="text-amber-400 drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]" />
                                            ) : (
                                                <Gift size={24} className="text-emerald-400 drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)]" />
                                            )}
                                        </div>
                                    ))}

                                    {!game.running && !game.over && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/15 px-4 text-center">
                                            <div className="rounded-2xl border border-white/20 bg-slate-950/75 px-4 py-4 text-sm font-semibold text-white">
                                                Tap the game area or press space to start.
                                            </div>
                                        </div>
                                    )}

                                    {game.paused && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 px-4 text-center">
                                            <div className="rounded-2xl border border-white/20 bg-slate-950/75 px-4 py-4 text-sm font-semibold text-white">
                                                Paused. Tap resume to continue.
                                            </div>
                                        </div>
                                    )}

                                    {game.over && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-4 text-center">
                                            <div className="rounded-2xl border border-violet-300/20 bg-slate-900/90 px-5 py-5 text-white shadow-xl">
                                                <div className="flex items-center justify-center gap-2 text-violet-200">
                                                    <Sparkles size={18} />
                                                    <span className="text-sm font-black uppercase tracking-[0.24em]">Run complete</span>
                                                </div>
                                                <p className="mt-3 text-xl font-black">Score {game.score}</p>
                                                <p className="mt-2 text-sm text-slate-300">You collected {game.collectedCoins} coins and {game.collectedVouchers} vouchers.</p>
                                                <div className="mt-4 flex items-center justify-center gap-3 text-sm font-semibold">
                                                    <span className="rounded-full bg-amber-400/20 px-3 py-1 text-amber-300">+{game.reward?.coins || 0} coins</span>
                                                    <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-300">+{game.reward?.vouchers || 0} vouchers</span>
                                                </div>
                                                <button type="button" onClick={startGame} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800">
                                                    <RotateCcw size={16} /> Play again
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={cx('rounded-2xl border p-4 text-sm', isDark ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50')}>
                                <p className="font-black uppercase tracking-[0.24em] text-violet-700">How it works</p>
                                <ul className={cx('mt-3 space-y-2', mutedText)}>
                                    <li>• Jump over obstacles to stay alive.</li>
                                    <li>• Grab coins and vouchers for bonus rewards.</li>
                                    <li>• Spend your rewards in the shop for discounts and offers.</li>
                                </ul>
                            </div>

                            <div className={cx('rounded-2xl border p-4 text-sm', isDark ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-slate-50')}>
                                <div className="flex items-center justify-between">
                                    <p className="font-black uppercase tracking-[0.24em] text-violet-700">Top runs</p>
                                    <span className="text-xs font-semibold text-slate-500">Local leaderboard</span>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {leaderboardItems.length > 0 ? leaderboardItems.map((entry, index) => (
                                        <div key={`${entry.label}-${index}`} className={cx('flex items-center justify-between rounded-lg border px-3 py-2', isDark ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-white')}>
                                            <div>
                                                <p className="text-sm font-bold">{entry.label}</p>
                                                <p className="text-xs text-slate-500">{entry.score} pts • {entry.coins} coins • {entry.vouchers} vouchers</p>
                                            </div>
                                            <span className="text-sm font-black text-violet-700">#{index + 1}</span>
                                        </div>
                                    )) : (
                                        <p className={cx('rounded-lg border px-3 py-3 text-sm', isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>No runs yet. Start one and your best scores will appear here.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}

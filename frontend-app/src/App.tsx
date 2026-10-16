import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  FiArrowUpRight, FiBell, FiBox, FiCheck, FiChevronDown, FiChevronRight,
  FiClock, FiCommand, FiGrid, FiLayers, FiLogOut, FiMenu, FiPlus, FiSearch,
  FiMessageCircle, FiSettings, FiShield, FiStar, FiTarget, FiTrash2, FiUsers, FiX, FiZap,
} from 'react-icons/fi'
import './App.css'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/v1/api'

type View = 'site' | 'dashboard'
type Page = 'Огляд' | 'Контакти' | 'Угоди' | 'Замовлення' | 'Задачі' | 'Боти' | 'Сигнали' | 'Аналітика' | 'Команда' | 'Налаштування'
type Contact = { id: number; initials: string; name: string; company: string; email: string; status: string; color: string; score: number }
type Deal = { id: number; name: string; company: string; value: number; stage: string; probability: number }
type Task = { id: number; title: string; due: string; done: boolean }
type Signal = { kind: string; title: string; description: string; priority: 'low' | 'medium' | 'high'; entityId?: number }
type Order = { id: string; customer: string; product: string; total: number; status: 'Нове' | 'В роботі' | 'Відправлено' | 'Завершено'; created: string }
type Bot = { id: string; name: string; role: string; description: string; color: string; online: boolean }
type ChatMessage = { from: 'user' | 'bot'; text: string; time: string }
type PlanKey = 'starter' | 'team' | 'scale'
type WorkspaceConfig = { name: string; plan: PlanKey; hierarchy: string[] }
type PermissionKey = 'contacts' | 'deals' | 'tasks' | 'orders' | 'analytics' | 'automation'
type TeamMember = { id: string; name: string; email: string; role: string; status: 'Активний' | 'Запрошено'; permissions: Record<PermissionKey, boolean>; color: string }
const permissionLabels: Record<PermissionKey, string> = { contacts: 'Контакти', deals: 'Угоди', tasks: 'Задачі', orders: 'Замовлення', analytics: 'Аналітика', automation: 'Боти та сигнали' }
const roleDefaults: Record<string, PermissionKey[]> = {
  Власник: ['contacts', 'deals', 'tasks', 'orders', 'analytics', 'automation'],
  Керівник: ['contacts', 'deals', 'tasks', 'orders', 'analytics', 'automation'],
  Менеджер: ['contacts', 'deals', 'tasks'],
  Спеціаліст: ['contacts', 'tasks'],
}
const seedMembers: TeamMember[] = [
  { id: 'owner', name: 'Олена Коваль', email: 'olena@orbit.studio', role: 'Власник', status: 'Активний', permissions: Object.fromEntries((Object.keys(permissionLabels) as PermissionKey[]).map(key => [key, true])) as Record<PermissionKey, boolean>, color: 'lavender' },
  { id: 'member-1', name: 'Максим Олійник', email: 'max@finery.io', role: 'Менеджер', status: 'Активний', permissions: { contacts: true, deals: true, tasks: true, orders: false, analytics: false, automation: false }, color: 'peach' },
  { id: 'member-2', name: 'Ірина Шевченко', email: 'iryna@nova.retail', role: 'Спеціаліст', status: 'Активний', permissions: { contacts: true, deals: false, tasks: true, orders: false, analytics: false, automation: false }, color: 'mint' },
]
const plans: { key: PlanKey; name: string; price: number; description: string; features: string[] }[] = [
  { key: 'starter', name: 'Старт', price: 50, description: 'Для власника та невеликої команди.', features: ['1 рівень ієрархії', 'До 5 користувачів', 'Контакти, угоди та задачі'] },
  { key: 'team', name: 'Команда', price: 100, description: 'Щоб розподіляти роботу між відділами.', features: ['2 рівні ієрархії', 'До 15 користувачів', 'Сигнали та автоматизації'] },
  { key: 'scale', name: 'Про', price: 200, description: 'Повний контроль для компанії, що росте.', features: ['3 рівні ієрархії', 'До 50 користувачів', 'Аналітика, боти та ролі'] },
]
const defaultWorkspace: WorkspaceConfig = { name: 'Orbit Studio', plan: 'team', hierarchy: ['Власник', 'Команда'] }

const navItems: { label: Page; icon: typeof FiGrid }[] = [
  { label: 'Огляд', icon: FiGrid }, { label: 'Контакти', icon: FiUsers },
  { label: 'Угоди', icon: FiTarget }, { label: 'Замовлення', icon: FiBox },
  { label: 'Задачі', icon: FiClock }, { label: 'Боти', icon: FiMessageCircle },
  { label: 'Сигнали', icon: FiStar },
  { label: 'Аналітика', icon: FiLayers },
  { label: 'Команда', icon: FiUsers },
]
const seedContacts: Contact[] = [
  { id: 1, initials: 'АК', name: 'Анастасія Коваль', company: 'Mriya Studio', email: 'anastasia@mriya.studio', status: 'Гаряча', color: 'lavender', score: 94 },
  { id: 2, initials: 'МО', name: 'Максим Олійник', company: 'Finery Labs', email: 'max@finery.io', status: 'У процесі', color: 'peach', score: 82 },
  { id: 3, initials: 'ІШ', name: 'Ірина Шевченко', company: 'Nova Retail', email: 'iryna@nova.retail', status: 'Нова', color: 'mint', score: 76 },
]
const seedDeals: Deal[] = [
  { id: 1, name: 'Enterprise partnership', company: 'Mriya Studio', value: 28000, stage: 'Переговори', probability: 82 },
  { id: 2, name: 'Retail intelligence', company: 'Nova Retail', value: 18500, stage: 'Пропозиція', probability: 64 },
  { id: 3, name: 'Team workspace', company: 'Finery Labs', value: 12400, stage: 'Кваліфікація', probability: 42 },
]
const seedTasks: Task[] = [
  { id: 1, title: 'Написати Анастасії щодо пропозиції', due: 'Сьогодні, 10:30', done: true },
  { id: 2, title: 'Підготувати демо для Nova Retail', due: 'Сьогодні, 14:00', done: false },
  { id: 3, title: 'Перевірити прогноз угоди Finery Labs', due: 'Завтра, 09:00', done: false },
]
const seedOrders: Order[] = [
  { id: 'ORD-1048', customer: 'Mriya Studio', product: 'Adaptive Enterprise · 12 міс.', total: 28000, status: 'В роботі', created: 'сьогодні, 09:42' },
  { id: 'ORD-1047', customer: 'Nova Retail', product: 'Retail Intelligence', total: 18500, status: 'Відправлено', created: 'вчора, 16:20' },
  { id: 'ORD-1046', customer: 'Finery Labs', product: 'Team workspace · 25 місць', total: 12400, status: 'Нове', created: 'вчора, 11:08' },
  { id: 'ORD-1045', customer: 'Orbit Health', product: 'Automation Pack', total: 7600, status: 'Завершено', created: '06 жовтня, 14:35' },
]
const bots: Bot[] = [
  { id: 'pulse', name: 'Pulse', role: 'Радар клієнтів', description: 'Помічає сигнали, ризики та найкращий момент для контакту.', color: 'purple', online: true },
  { id: 'flow', name: 'Flow', role: 'Оператор замовлень', description: 'Контролює шлях замовлення від оплати до доставки.', color: 'mint', online: true },
  { id: 'atlas', name: 'Atlas', role: 'Стратег продажів', description: 'Знаходить точки зростання у pipeline і готує наступний крок.', color: 'peach', online: true },
]

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T } catch { return fallback }
}
function write<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)) }

function App() {
  const [view, setView] = useState<View>(() => read('adaptive_session', false) ? 'dashboard' : 'site')
  const [auth, setAuth] = useState<'register' | 'login' | null>(null)
  const [setupOpen, setSetupOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    if (view === 'dashboard') return
    fetch('/api/auth/me', { credentials: 'include' }).then(response => {
      if (response.ok) { write('adaptive_session', true); setView('dashboard') }
    }).catch(() => undefined)
  }, [view])
  const openAuth = (mode: 'register' | 'login') => { setAuth(mode); setMenuOpen(false) }
  if (view === 'dashboard') return <Dashboard onLogout={() => { void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); localStorage.removeItem('adaptive_session'); setView('site') }} />
  if (setupOpen) return <WorkspaceSetup onComplete={workspace => { write('adaptive_workspace', workspace); setSetupOpen(false); setView('dashboard') }} />
  return <Landing openAuth={openAuth} setView={setView} menuOpen={menuOpen} setMenuOpen={setMenuOpen} auth={auth} closeAuth={() => setAuth(null)} />
}

function Landing({ openAuth, setView, menuOpen, setMenuOpen, auth, closeAuth }: { openAuth: (m: 'register' | 'login') => void; setView: (v: View) => void; menuOpen: boolean; setMenuOpen: (v: boolean) => void; auth: 'register' | 'login' | null; closeAuth: () => void }) {
  return <div className="marketing"><header className="site-header"><a className="brand" href="#top"><span className="brand-mark"><FiCommand /></span><span>adaptive<span>.</span></span></a><nav className={menuOpen ? 'site-nav is-open' : 'site-nav'}><a href="#why" onClick={() => setMenuOpen(false)}>Чому Adaptive</a><a href="#how" onClick={() => setMenuOpen(false)}>Як це працює</a><a href="#security" onClick={() => setMenuOpen(false)}>Безпека</a><button className="nav-login" onClick={() => openAuth('login')}>Увійти <FiArrowUpRight /></button></nav><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <FiX /> : <FiMenu />}</button></header><main id="top">
    <section className="hero-section"><div className="hero-atmosphere" aria-hidden="true"><span className="atmosphere-ring ring-a" /><span className="atmosphere-ring ring-b" /><span className="signal-particle particle-a" /><span className="signal-particle particle-b" /><span className="signal-particle particle-c" /></div><div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> CRM, що підлаштовується під вас</div><h1>Ваш бізнес.<br /><em>Ваша логіка.</em><br />Ваш ритм.</h1><p className="hero-description">Adaptive перетворює хаос у системні рішення. CRM, яка не змушує вас змінюватися — вона змінюється разом з вами.</p><div className="hero-actions"><button className="button button-primary" onClick={() => openAuth('register')}>Створити простір <FiArrowUpRight /></button><button className="button button-ghost" onClick={() => setView('dashboard')}><span className="play-icon">▶</span> Подивитись демо</button></div><div className="trust-line"><span className="avatar-stack"><i>О</i><i>М</i><i>К</i></span> Приєднуйтесь до 2,400+ команд <span className="trust-stars">★★★★★</span></div></div><Preview /></section>
    <section className="era-section"><div className="era-copy"><div className="eyebrow">ЦЕ НЕ ЩЕ ОДНА CRM</div><h2>Система, яка<br /><em>відчуває момент.</em></h2><p>У 2025 бізнеси не втрачають клієнтів через брак даних. Вони втрачають їх через зайвий шум. Adaptive прибирає шум і залишає тільки рух.</p><div className="era-metrics"><div><strong>01</strong><span>контекст<br />замість хаосу</span></div><div><strong>24/7</strong><span>сигнали<br />без пауз</span></div><div><strong>∞</strong><span>простір<br />для зростання</span></div></div></div><div className="era-orbit"><div className="orbit-core"><FiStar /><span>ваш<br />момент</span></div><span className="orbit-label label-a">люди</span><span className="orbit-label label-b">ритм</span><span className="orbit-label label-c">сигнали</span><i className="orbit-path path-a" /><i className="orbit-path path-b" /></div></section><section className="signal-strip"><div><span className="strip-icon"><FiZap /></span><b>Сигнали, а не таблиці.</b><span>Adaptive бачить те, що ви ще не встигли помітити.</span></div><span className="strip-line" /><div><span className="strip-icon purple"><FiStar /></span><b>Ваші правила.</b><span>Налаштуйте CRM під те, як ви думаєте.</span></div></section>
    <section className="section why-section" id="why"><div className="section-intro"><div className="eyebrow">ІНШИЙ ПОГЛЯД НА CRM</div><h2>Не просто зберігає.<br /><em>Допомагає рухатись.</em></h2><p>Поки інші CRM рахують минуле, Adaptive підказує наступний крок. У потрібний момент, у потрібному контексті.</p></div><div className="feature-list"><Feature icon={<FiTarget />} title="Наступна найкраща дія" text="Розумні сигнали показують, з ким говорити і коли — без зайвих звітів." /><Feature icon={<FiBox />} title="Простір, що росте з вами" text="Почніть з простого. Додавайте власні поля, процеси й команди без розробників." /><Feature icon={<FiShield />} title="Ваші дані — ваші правила" text="Прозорі дозволи, надійне шифрування та повний контроль над доступом." /></div></section>
    <section className="section workflow-section" id="how"><div className="workflow-copy"><div className="eyebrow">ЯК ЦЕ ПРАЦЮЄ</div><h2>Менше перемикань.<br /><em>Більше моментів.</em></h2><p>Adaptive збирає важливе в один живий простір, щоб ваша команда могла зосередитися на роботі.</p><button className="text-button" onClick={() => setView('dashboard')}>Побачити всередині <FiArrowUpRight /></button></div><div className="flow-visual"><div className="flow-node node-main"><FiStar /><b>Adaptive Brain</b><small>аналізує ваш контекст</small></div><div className="flow-node node-one"><FiUsers /><b>Контакти</b><small>+ 24 за тиждень</small></div><div className="flow-node node-two"><FiClock /><b>Задачі</b><small>5 у фокусі</small></div><div className="flow-node node-three"><FiZap /><b>Сигнали</b><small>3 нові</small></div></div></section>
    <PricingSection openAuth={openAuth} /><section className="security-section" id="security"><div><span className="security-lock"><FiShield /></span><div><div className="eyebrow">ПРОСТІР ДОВІРИ</div><h2>Створено для важливого.</h2></div></div><p>Європейські сервери · Шифрування даних · Двофакторний захист</p></section><section className="cta-section"><div className="eyebrow">ГОТОВІ ПОБАЧИТИ РІЗНИЦЮ?</div><h2>Ваш наступний рівень<br /><em>починається тут.</em></h2><button className="button button-primary" onClick={() => openAuth('register')}>Створити простір <FiArrowUpRight /></button><small>14 днів повного доступу · Без картки</small></section></main><footer><a className="brand" href="#top"><span className="brand-mark"><FiCommand /></span><span>adaptive<span>.</span></span></a><span>© 2025 Adaptive Systems</span><span>Зроблено для команд, що рухаються вперед.</span></footer>{auth && <AuthModal mode={auth} onClose={closeAuth} onSwitch={() => openAuth(auth === 'register' ? 'login' : 'register')} />}</div>
}

function PricingSection({ openAuth }: { openAuth: (mode: 'register' | 'login') => void }) {
  return <section className="section pricing-section" id="pricing"><div className="section-intro"><div className="eyebrow">ПРОЗОРА ВАРТІСТЬ</div><h2>Оберіть рівень<br /><em>свого простору.</em></h2><p>Почніть з потрібної ієрархії та масштабуйтеся без міграцій. Усі плани включають 14 днів повного доступу.</p></div><div className="pricing-grid">{plans.map(plan => <article className={`pricing-card ${plan.key === 'team' ? 'featured' : ''}`} key={plan.key}>{plan.key === 'team' && <span className="pricing-badge">НАЙПОПУЛЯРНІШИЙ</span>}<div className="pricing-card-header"><div><span className="pricing-name">{plan.name}</span><p>{plan.description}</p></div><strong>${plan.price}<small>/міс.</small></strong></div><ul>{plan.features.map(feature => <li key={feature}><FiCheck />{feature}</li>)}</ul><button className={`button ${plan.key === 'team' ? 'button-primary' : 'button-ghost pricing-button'}`} onClick={() => openAuth('register')}>Обрати {plan.name} <FiArrowUpRight /></button></article>)}</div></section>
}

function Preview() { return <div className="hero-visual"><div className="orbital orbital-one" /><div className="orbital orbital-two" /><div className="dashboard-preview"><div className="preview-top"><span className="mini-brand"><b /> adaptive.</span><span className="preview-time">Оновлено щойно <i /></span></div><div className="preview-heading"><div><small>ДОБРОГО РАНКУ, ОЛЕНО</small><h3>Ваш простір оживає.</h3></div><span className="date-pill">24 ЖОВТНЯ <FiChevronDown /></span></div><div className="preview-grid"><div className="metric-card"><small>ПРОГНОЗ ДОХОДУ</small><strong>$84,290 <span>↗ 18.4%</span></strong><div className="mini-chart"><b /><b /><b /><b /><b /><b /></div></div><div className="metric-card warm"><small>АКТИВНІ ДІАЛОГИ</small><strong>128 <span>↗ 12.8%</span></strong><div className="bars"><b /><b /><b /><b /><b /><b /></div></div></div><div className="adaptive-card"><span className="sparkle"><FiStar /></span><div><small>ADAPTIVE SIGNAL</small><p>Три клієнти готові до наступного кроку</p></div><FiChevronRight /></div><div className="preview-table"><div className="table-label"><span>ОСТАННІ КОНТАКТИ</span><a>Дивитись усі</a></div>{seedContacts.map(c => <div className="table-row" key={c.id}><span className={`contact-avatar ${c.color}`}>{c.initials}</span><div><b>{c.name}</b><small>{c.company}</small></div><span className="table-score">{c.score}</span><span className={`status ${c.color}`}>{c.status}</span></div>)}</div></div><div className="floating-note note-top"><span><FiZap /></span><b>AI помітив момент<small>Клієнт готовий до пропозиції</small></b></div></div> }
function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="feature"><span className="feature-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div><FiArrowUpRight className="feature-arrow" /></article> }

function AuthModal({ mode, onClose, onSwitch }: { mode: 'register' | 'login'; onClose: () => void; onSwitch: () => void }) {
  const startOAuth = (provider: 'google' | 'microsoft') => { window.location.href = `/api/auth/oauth/${provider}` }
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="auth-modal"><button className="close-modal" onClick={onClose}><FiX /></button><div className="modal-mark"><FiCommand /></div><div className="eyebrow">{mode === 'register' ? 'ПОЧНІТЬ СЬОГОДНІ' : 'З ПОВЕРНЕННЯМ'}</div><h2>{mode === 'register' ? <>Створіть свій<br /><em>Adaptive простір.</em></> : <>Увійдіть у свій<br /><em>Adaptive простір.</em></>}</h2><p>Тільки корпоративна пошта вашої компанії. Gmail та особисті адреси не приймаються.</p><div className="oauth-actions"><button className="oauth-button" onClick={() => startOAuth('microsoft')}><span className="oauth-logo microsoft-logo">▦</span><span>Продовжити з Microsoft 365</span><FiArrowUpRight /></button><button className="oauth-button" onClick={() => startOAuth('google')}><span className="oauth-logo google-logo">G</span><span>Продовжити з Google Workspace</span><FiArrowUpRight /></button></div><div className="corporate-hint"><FiShield /> Дозволений домен: <b>company.com</b></div><div className="auth-switch">{mode === 'register' ? 'Вже маєте акаунт?' : 'Ще не з нами?'} <button onClick={onSwitch}>{mode === 'register' ? 'Увійти' : 'Створити акаунт'}</button></div></div></div>
}

function WorkspaceSetup({ onComplete }: { onComplete: (workspace: WorkspaceConfig) => void }) {
  const [plan, setPlan] = useState<PlanKey>('team')
  const [name, setName] = useState('Мій Adaptive простір')
  const [hierarchy, setHierarchy] = useState(['Власник', 'Команда'])
  const selectedPlan = plans.find(item => item.key === plan) ?? plans[1]
  const maxLevels = plan === 'starter' ? 1 : plan === 'team' ? 2 : 3
  const toggleLevel = (level: string) => setHierarchy(current => current.includes(level) ? current.filter(item => item !== level) : current.length < maxLevels ? [...current, level] : current)
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onComplete({ name: name.trim(), plan, hierarchy: hierarchy.slice(0, maxLevels) }) }
  return <div className="setup-screen"><div className="setup-card"><div className="modal-mark"><FiLayers /></div><div className="eyebrow">КРОК 1 З 1 · НАЛАШТУВАННЯ ПРОСТОРУ</div><h1>Створіть CRM,<br /><em>яка працює по-вашому.</em></h1><p className="setup-intro">Виберіть тариф і визначте, як команда розподіляє відповідальність.</p><form onSubmit={submit}><label>Назва простору<input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} /></label><div className="setup-label">Тариф</div><div className="setup-plan-grid">{plans.map(item => <button type="button" className={`setup-plan ${plan === item.key ? 'selected' : ''}`} key={item.key} onClick={() => { setPlan(item.key); setHierarchy(current => current.slice(0, item.key === 'starter' ? 1 : item.key === 'team' ? 2 : 3)) }}><span>{item.name}</span><strong>${item.price}<small>/міс.</small></strong><small>{item.features[0]}</small></button>)}</div><div className="setup-label">Ієрархія команди <small>до {maxLevels} рівнів</small></div><div className="hierarchy-options">{['Власник', 'Керівник', 'Менеджер', 'Спеціаліст'].map(level => <button type="button" className={hierarchy.includes(level) ? 'selected' : ''} key={level} onClick={() => toggleLevel(level)}><span>{hierarchy.includes(level) ? <FiCheck /> : <span className="empty-check" />}</span>{level}</button>)}</div><div className="setup-summary"><FiShield /><span><b>{selectedPlan.name} · ${selectedPlan.price}/міс.</b><small>{hierarchy.length} рівні: {hierarchy.join(' → ')}</small></span></div><button className="button button-primary auth-submit" type="submit" disabled={hierarchy.length === 0}>Запустити мій простір <FiArrowUpRight /></button></form></div></div>
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [page, setPage] = useState<Page>('Огляд')
  const [workspace, setWorkspace] = useState<WorkspaceConfig>(() => read('adaptive_workspace', defaultWorkspace))
  const [members, setMembers] = useState<TeamMember[]>(() => read('adaptive_members', seedMembers))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState(() => read('adaptive_contacts', seedContacts))
  const [deals, setDeals] = useState(() => read('adaptive_deals', seedDeals))
  const [tasks, setTasks] = useState(() => read('adaptive_tasks', seedTasks))
  const [orders, setOrders] = useState<Order[]>(() => read('adaptive_orders', seedOrders))
  const [signals, setSignals] = useState<Signal[]>([])
  const [showContact, setShowContact] = useState(false)
  const [createMode, setCreateMode] = useState<'deal' | 'task' | null>(null)
  const [syncing, setSyncing] = useState(true)
  const [syncMessage, setSyncMessage] = useState('')
  useEffect(() => write('adaptive_contacts', contacts), [contacts])
  useEffect(() => write('adaptive_tasks', tasks), [tasks])
  useEffect(() => write('adaptive_orders', orders), [orders])
  useEffect(() => write('adaptive_members', members), [members])
  useEffect(() => {
    let active = true
    async function syncWorkspace() {
      const [contactResult, dealResult, taskResult, signalResult] = await Promise.all([
        apiGet<{ contacts: Array<Contact & { created_at?: string }> }>('/contacts'),
        apiGet<{ deals: Array<Deal & { updated_at?: string }> }>('/deals'),
        apiGet<{ tasks: Array<{ id: number; title: string; due_at: string; completed_at: string | null }> }>('/tasks'),
        apiGet<{ signals: Signal[] }>('/signals'),
      ])
      if (!active) return
      if (contactResult.data) setContacts(contactResult.data.contacts.map(contact => ({ ...contact, initials: contact.initials || contact.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(), color: contact.color || 'mint', score: Number(contact.score) })))
      if (dealResult.data) setDeals(dealResult.data.deals.map(deal => ({ ...deal, value: Number(deal.value), probability: Number(deal.probability) })))
      if (taskResult.data) setTasks(taskResult.data.tasks.map(task => ({ id: task.id, title: task.title, due: new Date(task.due_at).toLocaleString('uk-UA'), done: Boolean(task.completed_at) })))
      if (signalResult.data) setSignals(signalResult.data.signals)
      if (!contactResult.data && !dealResult.data && !taskResult.data && !signalResult.data) setSyncMessage('Офлайн-режим: дані збережені локально')
      setSyncing(false)
    }
    void syncWorkspace()
    return () => { active = false }
  }, [])
  const filteredContacts = useMemo(() => contacts.filter(c => `${c.name} ${c.company} ${c.email}`.toLowerCase().includes(query.toLowerCase())), [contacts, query])
  const toggleTask = async (id: number) => {
    const task = tasks.find(item => item.id === id)
    if (!task) return
    const nextDone = !task.done
    const result = await apiPatch<{ task: unknown }>(`/tasks/${id}`, { completed: nextDone })
    if (result.error && result.error !== 'AUTH_REQUIRED') setSyncMessage('Не вдалося оновити задачу')
    else setTasks(current => current.map(item => item.id === id ? { ...item, done: nextDone } : item))
  }
  const deleteContact = async (id: number) => { const result = await apiDelete(`/contacts/${id}`); if (result.error && result.error !== 'AUTH_REQUIRED') setSyncMessage('Не вдалося видалити контакт'); else setContacts(current => current.filter(contact => contact.id !== id)) }
  const saveContact = async (contact: Contact) => { const result = await apiPost<{ contact: Contact }>('/contacts', { name: contact.name, company: contact.company, email: contact.email }); if (result.data) setContacts(current => [{ ...result.data!.contact, initials: contact.initials, color: contact.color, score: Number(result.data!.contact.score) }, ...current]); else setContacts(current => [contact, ...current]); setShowContact(false) }
  const saveDeal = async (deal: Omit<Deal, 'id'>) => { const result = await apiPost<{ deal: Deal }>('/deals', deal); if (result.data) setDeals(current => [result.data!.deal, ...current]); setCreateMode(null) }
  const saveTask = async (task: { title: string; dueAt: string }) => { const result = await apiPost<{ task: { id: number; title: string; due_at: string; completed_at: string | null } }>('/tasks', task); if (result.data) setTasks(current => [{ id: result.data!.task.id, title: result.data!.task.title, due: new Date(result.data!.task.due_at).toLocaleString('uk-UA'), done: false }, ...current]); setCreateMode(null) }
  const updateOrder = (id: string, status: Order['status']) => setOrders(current => current.map(order => order.id === id ? { ...order, status } : order))
  return <div className="app-shell"><aside className={sidebarOpen ? 'app-sidebar is-open' : 'app-sidebar'}><div className="sidebar-brand"><span className="brand-mark"><FiCommand /></span><span>adaptive<span>.</span></span></div><div className="workspace-switch"><span className="workspace-avatar">{workspace.name.slice(0, 1).toUpperCase()}</span><span><small>{plans.find(item => item.key === workspace.plan)?.name.toUpperCase()} · ${plans.find(item => item.key === workspace.plan)?.price}/МІС</small><b>{workspace.name}</b></span><FiChevronDown /></div><nav className="app-nav">{navItems.map(({ label, icon: Icon }) => <button className={page === label ? 'active' : ''} key={label} onClick={() => { setPage(label); setSidebarOpen(false) }}><Icon />{label}{label === 'Сигнали' && signals.length > 0 && <i className="nav-badge">{signals.length}</i>}{label === 'Боти' && <i className="nav-live">LIVE</i>}</button>)}</nav><div className="sidebar-bottom"><button onClick={() => setPage('Налаштування')}><FiSettings />Налаштування</button><button onClick={onLogout}><FiLogOut />Вийти</button><div className="user-chip"><span className="user-avatar">ОК</span><span><b>Олена Коваль</b><small>{workspace.hierarchy.join(' → ')}</small></span><span className="more-dots">•••</span></div></div></aside><div className="app-main"><header className="app-header"><button className="mobile-menu app-menu" onClick={() => setSidebarOpen(!sidebarOpen)}><FiMenu /></button><div className="app-search"><FiSearch /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Пошук у просторі..." /><kbd>⌘ K</kbd></div><div className="header-actions"><button><FiBell /><i /></button><span className="header-date">{syncing ? 'Синхронізація...' : syncMessage || 'Синхронізовано'}</span><button className="header-add" onClick={() => setShowContact(true)}><FiPlus /> Додати</button></div></header><main className="app-content"><DashboardPage page={page} contacts={filteredContacts} deals={deals} tasks={tasks} signals={signals} orders={orders} workspace={workspace} members={members} onMembersChange={next => setMembers(next)} onWorkspaceChange={next => { setWorkspace(next); write('adaptive_workspace', next) }} toggleTask={toggleTask} updateOrder={updateOrder} onAdd={() => setShowContact(true)} onNewDeal={() => setCreateMode('deal')} onNewTask={() => setCreateMode('task')} onDelete={deleteContact} /></main></div>{showContact && <ContactModal onClose={() => setShowContact(false)} onSave={saveContact} />}{createMode === 'deal' && <DealModal onClose={() => setCreateMode(null)} onSave={saveDeal} />}{createMode === 'task' && <TaskModal onClose={() => setCreateMode(null)} onSave={saveTask} />}</div>
}

function DashboardPage({ page, contacts, deals, tasks, signals, orders, workspace, members, onMembersChange, onWorkspaceChange, toggleTask, updateOrder, onAdd, onNewDeal, onNewTask, onDelete }: { page: Page; contacts: Contact[]; deals: Deal[]; tasks: Task[]; signals: Signal[]; orders: Order[]; workspace: WorkspaceConfig; members: TeamMember[]; onMembersChange: (members: TeamMember[]) => void; onWorkspaceChange: (workspace: WorkspaceConfig) => void; toggleTask: (id: number) => void; updateOrder: (id: string, status: Order['status']) => void; onAdd: () => void; onNewDeal: () => void; onNewTask: () => void; onDelete: (id: number) => void }) {
  if (page === 'Контакти') return <section className="content-page"><PageTitle eyebrow="КЛІЄНТСЬКА БАЗА" title="Контакти" text={`${contacts.length} активних контактів у вашому просторі.`} action="Новий контакт" onAction={onAdd} /><div className="record-list">{contacts.map(c => <div className="record-card" key={c.id}><span className={`contact-avatar ${c.color}`}>{c.initials}</span><div><b>{c.name}</b><small>{c.company} · {c.email}</small></div><span className={`status ${c.color}`}>{c.status}</span><strong>{c.score}</strong><button onClick={() => onDelete(c.id)} aria-label={`Видалити ${c.name}`}><FiTrash2 /></button></div>)}</div></section>
  if (page === 'Угоди') return <section className="content-page"><PageTitle eyebrow="PIPELINE" title="Угоди" text="Керуйте можливостями та прогнозом доходу." action="Нова угода" onAction={onNewDeal} /><div className="deal-columns">{['Кваліфікація', 'Пропозиція', 'Переговори'].map(stage => <div className="deal-column" key={stage}><h3>{stage}<span>{deals.filter(d => d.stage === stage).length}</span></h3>{deals.filter(d => d.stage === stage).map(d => <article className="deal-card" key={d.id}><b>{d.name}</b><small>{d.company}</small><strong>${d.value.toLocaleString()}</strong><div><span>{d.probability}% ймовірність</span><i style={{ width: `${d.probability}%` }} /></div></article>)}</div>)}</div></section>
  if (page === 'Замовлення') return <OrdersPage orders={orders} updateOrder={updateOrder} />
  if (page === 'Задачі') return <section className="content-page"><PageTitle eyebrow="ФОКУС КОМАНДИ" title="Задачі" text={`${tasks.filter(t => !t.done).length} задач залишилось у фокусі.`} action="Нова задача" onAction={onNewTask} /><div className="record-list task-list">{tasks.map(t => <label className={`record-card task-record ${t.done ? 'completed' : ''}`} key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} /><div><b>{t.title}</b><small>{t.due}</small></div><FiCheck /></label>)}</div></section>
  if (page === 'Боти') return <BotsPage />
  if (page === 'Сигнали') return <section className="content-page"><PageTitle eyebrow="ADAPTIVE BRAIN" title="Сигнали" text={signals.length ? `${signals.length} моментів потребують уваги.` : 'Нових ризиків не знайдено.'} /><div className="record-list signal-list">{signals.map(signal => <article className="record-card" key={`${signal.kind}-${signal.entityId}-${signal.title}`}><span className={`signal-symbol ${signal.priority === 'high' ? 'orange' : 'purple'}`}><FiStar /></span><div><b>{signal.title}</b><small>{signal.description}</small></div><span className={`status ${signal.priority === 'high' ? 'peach' : 'lavender'}`}>{signal.priority}</span></article>)}</div></section>
  if (page === 'Аналітика') return <section className="content-page"><PageTitle eyebrow="ДАНІ, ЩО РУХАЮТЬ" title="Аналітика" text="Дивіться на бізнес через дії, а не лише цифри." /><div className="analytics-grid"><Stat title="Конверсія pipeline" value="68.4%" change="+8.2%" icon={<FiTarget />} /><Stat title="Середній чек" value="$19,640" change="+12.8%" icon={<FiBox />} /><Stat title="Швидкість відповіді" value="18 хв" change="-24.1%" icon={<FiClock />} /></div><div className="panel insight-panel"><FiStar /><div><b>Adaptive insight</b><p>Угоди, де перший follow-up відбувається протягом 24 годин, закриваються на 41% частіше.</p></div></div></section>
  if (page === 'Команда') return <TeamPage members={members} hierarchy={workspace.hierarchy} onChange={onMembersChange} />
  if (page === 'Налаштування') return <Settings workspace={workspace} onChange={onWorkspaceChange} />
  return <Overview contacts={contacts} tasks={tasks} onAdd={onAdd} toggleTask={toggleTask} />
}

function OrdersPage({ orders, updateOrder }: { orders: Order[]; updateOrder: (id: string, status: Order['status']) => void }) {
  const total = orders.reduce((sum, order) => sum + order.total, 0)
  return <section className="content-page"><PageTitle eyebrow="ОПЕРАЦІЙНИЙ ЦЕНТР" title="Замовлення" text="Весь шлях клієнта — в одному живому потоці." action="Синхронізовано" /><div className="order-summary"><div><small>Замовлень у потоці</small><strong>{orders.length}</strong></div><div><small>Обіг за період</small><strong>${total.toLocaleString()}</strong></div><div><small>Автоматично оброблено</small><strong>92%</strong></div></div><div className="record-list order-list">{orders.map(order => <article className="record-card order-card" key={order.id}><span className="order-icon"><FiBox /></span><div className="order-main"><b>{order.id} · {order.customer}</b><small>{order.product} · {order.created}</small></div><strong>${order.total.toLocaleString()}</strong><select value={order.status} onChange={event => updateOrder(order.id, event.target.value as Order['status'])} className={`order-status ${order.status === 'Завершено' ? 'done' : ''}`}><option>Нове</option><option>В роботі</option><option>Відправлено</option><option>Завершено</option></select><FiChevronRight /></article>)}</div></section>
}

function BotsPage() {
  const [activeBot, setActiveBot] = useState(bots[0])
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<Record<string, ChatMessage[]>>(() => read('adaptive_bot_chats', {
    pulse: [{ from: 'bot', text: 'Привіт! Я Pulse. Знайшов 3 моменти, які можуть прискорити ваші угоди. Що показати?', time: 'зараз' }],
    flow: [{ from: 'bot', text: 'Я стежу за замовленнями 24/7. Можу показати затримки або зібрати звіт.', time: 'зараз' }],
    atlas: [{ from: 'bot', text: 'Готовий перетворити ваш pipeline на наступний крок. Запитайте про прогноз.', time: 'зараз' }],
  }))
  const messages = chat[activeBot.id] || []
  const sendMessage = (text = message) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const reply = activeBot.id === 'pulse' ? 'Бачу сигнал: Nova Retail відкривала пропозицію 4 рази. Рекомендую follow-up сьогодні до 16:00.' : activeBot.id === 'flow' ? 'Знайшов 1 замовлення у статусі «Нове». Я можу підготувати його до відправки.' : 'Прогноз на цей місяць — $84,290. Найбільший потенціал зараз у сегменті Enterprise.'
    setChat(current => ({ ...current, [activeBot.id]: [...(current[activeBot.id] || []), { from: 'user', text: trimmed, time: 'зараз' }, { from: 'bot', text: reply, time: 'зараз' }] }))
    write('adaptive_bot_chats', { ...chat, [activeBot.id]: [...messages, { from: 'user', text: trimmed, time: 'зараз' }, { from: 'bot', text: reply, time: 'зараз' }] })
    setMessage('')
  }
  return <section className="content-page"><PageTitle eyebrow="ADAPTIVE AGENTS" title="Боти" text="Не чат-боти. Цифрові члени команди, які діють разом із вами." /><div className="bots-layout"><div className="bot-directory">{bots.map(bot => <button className={`bot-card ${activeBot.id === bot.id ? 'active' : ''}`} key={bot.id} onClick={() => setActiveBot(bot)}><span className={`bot-avatar ${bot.color}`}>{bot.name[0]}</span><span><b>{bot.name}<i className="online-dot" /></b><small>{bot.role}</small><em>{bot.description}</em></span><FiChevronRight /></button>)}</div><div className="bot-chat"><div className="bot-chat-header"><span className={`bot-avatar ${activeBot.color}`}>{activeBot.name[0]}</span><div><b>{activeBot.name}</b><small><i className="online-dot" /> Онлайн · відповідає за {activeBot.role.toLowerCase()}</small></div><button className="bot-action" onClick={() => sendMessage('Зроби короткий звіт за сьогодні')}>Запустити дію <FiZap /></button></div><div className="chat-messages">{messages.map((item, index) => <div className={`chat-message ${item.from}`} key={`${item.time}-${index}`}><span>{item.text}</span><small>{item.time}</small></div>)}</div><div className="chat-suggestions"><button onClick={() => sendMessage('Що важливо знати зараз?')}>Що важливо зараз?</button><button onClick={() => sendMessage('Покажи наступний крок')}>Покажи наступний крок</button></div><form className="chat-input" onSubmit={event => { event.preventDefault(); sendMessage() }}><FiMessageCircle /><input value={message} onChange={event => setMessage(event.target.value)} placeholder={`Написати ${activeBot.name}...`} /><button type="submit"><FiArrowUpRight /></button></form></div></div></section>
}

function PageTitle({ eyebrow, title, text, action, onAction }: { eyebrow: string; title: string; text: string; action?: string; onAction?: () => void }) { return <div className="dashboard-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>{action && <button className="button button-primary" onClick={onAction}><FiPlus /> {action}</button>}</div> }
function Stat({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) { return <div className="stat-card"><span className="stat-icon">{icon}</span><small>{title}</small><strong>{value}</strong><span className="stat-change">↗ {change}</span></div> }
function Overview({ contacts, tasks, onAdd, toggleTask }: { contacts: Contact[]; tasks: Task[]; onAdd: () => void; toggleTask: (id: number) => void }) { return <><PageTitle eyebrow="ЧЕТВЕР, 24 ЖОВТНЯ" title="Доброго ранку, Олено ✦" text={`У просторі ${contacts.length} активних контактів. Ось що відбувається сьогодні.`} action="Новий контакт" onAction={onAdd} /><div className="dashboard-grid"><div className="dashboard-main"><div className="stats-grid"><Stat title="Прогноз доходу" value="$84,290" change="+18.4%" icon={<FiTarget />} /><Stat title="Активні угоди" value="24" change="+6 цього тижня" icon={<FiLayers />} /><Stat title="Середній цикл" value="12.4 дні" change="-2.1 дні" icon={<FiClock />} /></div><section className="panel revenue-panel"><div className="panel-header"><div><h2>Ритм доходу</h2><p>Реалізовано та прогноз на жовтень</p></div><button className="select-button">Останні 30 днів <FiChevronDown /></button></div><div className="revenue-value">$62,480 <span>+24.8%</span></div><div className="large-chart"><div className="chart-labels"><span>$100k</span><span>$75k</span><span>$50k</span><span>$25k</span><span>$0</span></div><div className="chart-area"><div className="grid-line one" /><div className="grid-line two" /><div className="grid-line three" /><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0 158 C50 150 60 130 100 138 S140 116 180 126 S215 92 250 111 S295 80 330 94 S365 74 400 79 S440 52 475 64 S520 40 550 48 S580 25 600 12 V180 H0Z" fill="#8174ee22" /><path d="M0 158 C50 150 60 130 100 138 S140 116 180 126 S215 92 250 111 S295 80 330 94 S365 74 400 79 S440 52 475 64 S520 40 550 48 S580 25 600 12" fill="none" stroke="#8275f4" strokeWidth="3" /></svg><div className="chart-months"><span>01 жов</span><span>08 жов</span><span>15 жов</span><span>22 жов</span><span>31 жов</span></div></div></div></section></div><aside className="dashboard-side"><section className="panel signal-panel"><div className="panel-header"><div><h2>Adaptive signals</h2><p>Те, що варто знати зараз</p></div><span className="signal-live"><i /> LIVE</span></div><div className="signal-item"><span className="signal-symbol purple"><FiStar /></span><div><b>Момент для контакту</b><p>Анастасія Коваль переглянула пропозицію 3 рази.</p><small>12 хв тому</small></div></div><div className="signal-item"><span className="signal-symbol orange"><FiZap /></span><div><b>Ризик угоди</b><p>Угода Finery Labs без активності 8 днів.</p><small>1 год тому</small></div></div></section><section className="panel focus-panel"><div className="panel-header"><div><h2>Фокус дня</h2><p>Ваші наступні кроки</p></div></div>{tasks.slice(0, 3).map(t => <label className={`focus-task ${t.done ? 'completed' : ''}`} key={t.id}><input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} /><span>{t.title}</span><small>{t.due}</small></label>)}</section></aside></div></> }
function TeamPage({ members, hierarchy, onChange }: { members: TeamMember[]; hierarchy: string[]; onChange: (members: TeamMember[]) => void }) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('owner')
  const selected = members.find(member => member.id === selectedId) ?? members[0]
  const updateMember = (patch: Partial<TeamMember>) => onChange(members.map(member => member.id === selected.id ? { ...member, ...patch } : member))
  const togglePermission = (permission: PermissionKey) => updateMember({ permissions: { ...selected.permissions, [permission]: !selected.permissions[permission] } })
  const promote = (role: string) => updateMember({ role, permissions: Object.fromEntries((Object.keys(permissionLabels) as PermissionKey[]).map(permission => [permission, roleDefaults[role].includes(permission)])) as Record<PermissionKey, boolean> })
  const invite = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); const role = String(data.get('role')); const name = String(data.get('name')); const email = String(data.get('email')); const permissions = Object.fromEntries((Object.keys(permissionLabels) as PermissionKey[]).map(permission => [permission, roleDefaults[role].includes(permission)])) as Record<PermissionKey, boolean>; onChange([...members, { id: `member-${Date.now()}`, name, email, role, status: 'Запрошено', permissions, color: 'lavender' }]); setInviteOpen(false) }
  return <section className="content-page team-page"><PageTitle eyebrow="ЦЕНТР КОМАНДИ" title="Команда та права" text="CEO керує учасниками, ролями та доступом до кожного модуля." action="Додати учасника" onAction={() => setInviteOpen(true)} /><div className="team-layout"><div className="panel members-panel"><div className="panel-header"><div><h2>Учасники</h2><p>{members.length} користувачів у просторі</p></div><span className="role-owner"><FiShield /> CEO</span></div><div className="member-list">{members.map(member => <button className={`member-row ${selected.id === member.id ? 'selected' : ''}`} key={member.id} onClick={() => setSelectedId(member.id)}><span className={`contact-avatar ${member.color}`}>{member.name.split(' ').map(part => part[0]).join('').slice(0, 2)}</span><span><b>{member.name}</b><small>{member.email}</small></span><strong>{member.role}</strong><i className={member.status === 'Активний' ? 'member-online' : 'member-invite'}>{member.status}</i></button>)}</div></div><div className="panel permissions-panel"><div className="panel-header"><div><h2>Права доступу</h2><p>Змінюйте можливості: {selected.name}</p></div><span className="permission-count">{Object.values(selected.permissions).filter(Boolean).length}/{Object.keys(permissionLabels).length}</span></div><label className="role-field">Роль<select value={selected.role} onChange={event => promote(event.target.value)}>{hierarchy.map(role => <option key={role}>{role}</option>)}</select></label><div className="permission-list">{(Object.keys(permissionLabels) as PermissionKey[]).map(permission => <button className={`permission-row ${selected.permissions[permission] ? 'enabled' : ''}`} key={permission} onClick={() => togglePermission(permission)}><span><FiCheck /></span><b>{permissionLabels[permission]}</b><small>{selected.permissions[permission] ? 'Дозволено' : 'Заборонено'}</small><i /></button>)}</div><p className="settings-note"><FiShield /> Тільки CEO може підвищувати роль і редагувати права учасників.</p></div></div>{inviteOpen && <div className="modal-backdrop"><div className="auth-modal"><button className="close-modal" onClick={() => setInviteOpen(false)}><FiX /></button><div className="modal-mark"><FiUsers /></div><div className="eyebrow">НОВИЙ УЧАСНИК</div><h2>Додайте людину<br /><em>до команди.</em></h2><form onSubmit={invite}><label>Ім’я<input name="name" required placeholder="Анна Мельник" /></label><label>Робочий email<input name="email" required type="email" placeholder="anna@company.com" /></label><label>Початкова роль<select name="role" defaultValue={hierarchy[0] ?? 'Спеціаліст'}>{hierarchy.map(role => <option key={role}>{role}</option>)}</select></label><button className="button button-primary auth-submit" type="submit">Надіслати запрошення <FiArrowUpRight /></button></form></div></div>}</section>
}

function Settings({ workspace, onChange }: { workspace: WorkspaceConfig; onChange: (workspace: WorkspaceConfig) => void }) { const [saved, setSaved] = useState(false); const plan = plans.find(item => item.key === workspace.plan) ?? plans[1]; const updateName = (name: string) => onChange({ ...workspace, name }); return <section className="content-page"><PageTitle eyebrow="КОНТРОЛЬ ПРОСТОРУ" title="Налаштування" text="Керуйте профілем, тарифом та ієрархією Adaptive." /><div className="settings-grid"><div className="panel settings-card"><h2>Профіль простору</h2><label>Назва простору<input value={workspace.name} onChange={event => updateName(event.target.value)} /></label><label>Ваше ім’я<input defaultValue="Олена Коваль" /></label><label>Робочий email<input defaultValue="olena@orbit.studio" type="email" /></label><button className="button button-primary" onClick={() => setSaved(true)}>{saved ? 'Збережено ✓' : 'Зберегти зміни'}</button></div><div className="panel settings-card"><h2>Ваш тариф та ієрархія</h2><div className="plan-summary"><span className="pricing-icon"><FiLayers /></span><div><b>{plan.name} · ${plan.price}/міс.</b><small>{plan.features[0]} · {plan.features[1]}</small></div></div><div className="hierarchy-tree">{workspace.hierarchy.map((level, index) => <div key={level}><span>{index + 1}</span><b>{level}</b>{index < workspace.hierarchy.length - 1 && <i />}</div>)}</div><p className="settings-note">Ролі допомагають розподіляти доступ і відповідальність між командами.</p></div></div></section> }
function ContactModal({ onClose, onSave }: { onClose: () => void; onSave: (contact: Contact) => void }) { const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); const data = new FormData(e.currentTarget); const name = String(data.get('name')); const parts = name.split(' '); onSave({ id: Date.now(), name, initials: parts.map(p => p[0]).join('').slice(0, 2).toUpperCase(), company: String(data.get('company')), email: String(data.get('email')), status: 'Нова', color: 'mint', score: 70 }) }; return <div className="modal-backdrop"><div className="auth-modal"><button className="close-modal" onClick={onClose}><FiX /></button><div className="modal-mark"><FiUsers /></div><div className="eyebrow">НОВИЙ КОНТАКТ</div><h2>Додайте людину<br /><em>у свій простір.</em></h2><form onSubmit={submit}><label>Ім’я та прізвище<input name="name" required placeholder="Ірина Шевченко" /></label><label>Компанія<input name="company" required placeholder="Nova Retail" /></label><label>Email<input name="email" required type="email" placeholder="name@company.com" /></label><button className="button button-primary auth-submit" type="submit">Зберегти контакт <FiCheck /></button></form></div></div> }

function DealModal({ onClose, onSave }: { onClose: () => void; onSave: (deal: Omit<Deal, 'id'>) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ name: String(data.get('name')), company: String(data.get('company')), value: Number(data.get('value')), stage: String(data.get('stage')), probability: Number(data.get('probability')) }) }
  return <div className="modal-backdrop"><div className="auth-modal"><button className="close-modal" onClick={onClose}><FiX /></button><div className="modal-mark"><FiTarget /></div><div className="eyebrow">НОВА УГОДА</div><h2>Додайте можливість<br /><em>у pipeline.</em></h2><form onSubmit={submit}><label>Назва угоди<input name="name" required placeholder="Enterprise partnership" /></label><label>Компанія<input name="company" required placeholder="Mriya Studio" /></label><label>Сума<input name="value" required type="number" min="0" step="100" placeholder="25000" /></label><label>Етап<select name="stage" defaultValue="Кваліфікація"><option>Кваліфікація</option><option>Пропозиція</option><option>Переговори</option><option>Закрито</option></select></label><label>Ймовірність<input name="probability" required type="number" min="0" max="100" defaultValue="50" /></label><button className="button button-primary auth-submit" type="submit">Зберегти угоду <FiCheck /></button></form></div></div>
}

function TaskModal({ onClose, onSave }: { onClose: () => void; onSave: (task: { title: string; dueAt: string }) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); onSave({ title: String(data.get('title')), dueAt: new Date(String(data.get('dueAt'))).toISOString() }) }
  return <div className="modal-backdrop"><div className="auth-modal"><button className="close-modal" onClick={onClose}><FiX /></button><div className="modal-mark"><FiClock /></div><div className="eyebrow">НОВА ЗАДАЧА</div><h2>Задайте наступний<br /><em>крок команди.</em></h2><form onSubmit={submit}><label>Що потрібно зробити?<input name="title" required placeholder="Підготувати демо для клієнта" /></label><label>Дедлайн<input name="dueAt" required type="datetime-local" /></label><button className="button button-primary auth-submit" type="submit">Створити задачу <FiCheck /></button></form></div></div>
}

export default App

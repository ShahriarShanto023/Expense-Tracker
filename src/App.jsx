import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Plus, LogOut, Trash2,
  LayoutDashboard, ReceiptText, ChartNoAxesCombined, CalendarDays, X,
  CircleDollarSign, LoaderCircle, ShieldCheck, Settings2,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  PieChart, Pie, Cell,
} from 'recharts'
import { isSupabaseConfigured, supabase } from './lib/supabase'

const CATEGORIES = ['Food & Dining', 'Transport', 'Shopping', 'Bills & Utilities', 'Health', 'Education', 'Entertainment', 'Salary', 'Freelance', 'Other']
const COLORS = ['#6d7cff', '#31b89a', '#f5b544', '#f07878', '#9b7bf6', '#48a9d6', '#e78ab8', '#8b9aaa']
const money = (amount) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(amount || 0))
const localDate = () => {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const monthKey = (date) => String(date || '').slice(0, 7)
const monthLabel = (key) => new Date(`${key}-01T12:00:00`).toLocaleDateString('en', { month: 'short' })

function SetupNotice() {
  return <main className="setup-wrap"><section className="setup-card">
    <div className="brand-mark"><Wallet size={26} /></div>
    <p className="eyebrow">YOUR MONEY, CLEARER</p><h1>Set up your expense tracker</h1>
    <p className="muted">The frontend is ready. Connect a free Supabase project to enable sign-in and securely store your transactions.</p>
    <ol className="setup-list">
      <li>Copy <code>.env.example</code> to <code>.env.local</code>.</li>
      <li>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</li>
      <li>Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.</li>
      <li>Restart the dev server with <code>npm run dev</code>.</li>
    </ol>
    <a className="button primary full" href="https://supabase.com/" target="_blank" rel="noreferrer">Create a free Supabase project</a>
  </section></main>
}

function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(event) {
    event.preventDefault()
    setBusy(true); setMessage('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (error) throw error
        setMessage('Account created. If email confirmation is enabled, check your inbox before signing in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) { setMessage(error.message || 'Could not authenticate. Please try again.') }
    finally { setBusy(false) }
  }
  return <main className="auth-wrap"><section className="auth-card">
    <div className="brand-lockup"><span className="brand-mark"><Wallet size={24}/></span><span>pocket<span className="brand-accent">wise</span></span></div>
    <p className="eyebrow">PERSONAL FINANCE, SIMPLIFIED</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
    <p className="muted">{mode === 'login' ? 'Sign in to see where your money goes.' : 'Start building a clearer picture of your money.'}</p>
    <form onSubmit={submit} className="stack-form">
      {mode === 'signup' && <label>Full name<input required value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></label>}
      <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
      <label>Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {message && <p className="notice">{message}</p>}
      <button className="button primary full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{mode === 'login' ? 'Sign in' : 'Create account'}</button>
    </form>
    <p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already have an account?'} <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
    <p className="fine-print">Your financial data is protected by Supabase authentication and database access policies.</p>
  </section></main>
}

function AppShell({ session, profile, onSignOut }) {
  const [section, setSection] = useState('Overview')
  const [transactions, setTransactions] = useState([])
  const [budget, setBudget] = useState(15000)
  const [budgetInput, setBudgetInput] = useState('15000')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food & Dining', description: '', transaction_date: localDate(), payment_method: 'Cash' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const loadData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [{ data, error: txError }, { data: budgets, error: budgetError }] = await Promise.all([
        supabase.from('transactions').select('id,type,amount,category,description,transaction_date,payment_method,created_at').order('transaction_date', { ascending: false }),
        supabase.from('budgets').select('id,monthly_limit').limit(1).maybeSingle(),
      ])
      if (txError) throw txError
      if (budgetError) throw budgetError
      setTransactions(data || [])
      if (budgets) { setBudget(Number(budgets.monthly_limit)); setBudgetInput(String(budgets.monthly_limit)) }
    } catch (e) { setError(e.message || 'Unable to load data. Check your Supabase schema and policies.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const currentMonth = localDate().slice(0, 7)
  const thisMonth = useMemo(() => transactions.filter(t => monthKey(t.transaction_date) === currentMonth), [transactions, currentMonth])
  const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = income - expenses
  const remaining = Math.max(Number(budget) - expenses, 0)
  const categoryData = useMemo(() => {
    const totals = {}
    thisMonth.filter(t => t.type === 'expense').forEach(t => { totals[t.category] = (totals[t.category] || 0) + Number(t.amount) })
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [thisMonth])
  const trendData = useMemo(() => {
    const keys = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1); d.setMonth(d.getMonth() - i)
      keys.push(d.toISOString().slice(0, 7))
    }
    return keys.map(key => {
      const month = transactions.filter(t => monthKey(t.transaction_date) === key)
      return { month: monthLabel(key), income: month.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0), expenses: month.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) }
    })
  }, [transactions])
  const visibleTransactions = transactions.filter(t => filter === 'all' || t.type === filter)

  async function addTransaction(event) {
    event.preventDefault()
    if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) { setError('Enter an amount greater than zero.'); return }
    setSaving(true); setError('')
    try {
      const { data, error: insertError } = await supabase.from('transactions').insert({
        user_id: session.user.id, type: form.type, amount: Number(form.amount), category: form.category,
        description: form.description.trim() || form.category, transaction_date: form.transaction_date, payment_method: form.payment_method,
      }).select().single()
      if (insertError) throw insertError
      setTransactions(prev => [data, ...prev])
      setForm({ type: 'expense', amount: '', category: 'Food & Dining', description: '', transaction_date: localDate(), payment_method: 'Cash' })
      setShowForm(false)
    } catch (e) { setError(e.message || 'Could not save transaction.') }
    finally { setSaving(false) }
  }

  async function deleteTransaction(id) {
    if (!window.confirm('Delete this transaction?')) return
    const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id)
    if (deleteError) setError(deleteError.message)
    else setTransactions(prev => prev.filter(t => t.id !== id))
  }

  async function saveBudget(event) {
    event.preventDefault()
    const amount = Number(budgetInput)
    if (!Number.isFinite(amount) || amount <= 0) { setError('Budget must be greater than zero.'); return }
    setError('')
    const { error: saveError } = await supabase.from('budgets').upsert({ user_id: session.user.id, monthly_limit: amount }, { onConflict: 'user_id' })
    if (saveError) setError(saveError.message)
    else { setBudget(amount); setSection('Overview') }
  }

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="brand-lockup side-brand"><span className="brand-mark"><Wallet size={22}/></span><span>pocket<span className="brand-accent">wise</span></span></div>
      <p className="nav-caption">WORKSPACE</p>
      <nav>{[{name:'Overview',icon:LayoutDashboard},{name:'Transactions',icon:ReceiptText},{name:'Analytics',icon:ChartNoAxesCombined},{name:'Budget',icon:PiggyBank}].map(item => <button key={item.name} className={section === item.name ? 'nav-item active' : 'nav-item'} onClick={() => setSection(item.name)}><item.icon size={18}/>{item.name}</button>)}</nav>
      <div className="sidebar-bottom"><div className="user-mini"><div className="avatar">{(profile?.full_name || session.user.email || 'U').slice(0,1).toUpperCase()}</div><div className="user-details"><strong>{profile?.full_name || session.user.email?.split('@')[0]}</strong><span>{profile?.role === 'admin' ? 'Administrator' : 'Personal account'}</span></div><button className="icon-button" title="Sign out" onClick={onSignOut}><LogOut size={17}/></button></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">PERSONAL FINANCE</p><h1>{section === 'Overview' ? 'Your overview' : section}</h1></div><div className="top-actions"><span className="date-chip"><CalendarDays size={15}/>{new Date().toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})}</span><button className="button primary" onClick={() => setShowForm(true)}><Plus size={17}/> Add transaction</button></div></header>
      {error && <div className="error-banner" role="alert">{error}<button className="icon-button" onClick={() => setError('')}><X size={16}/></button></div>}
      {loading ? <div className="loading"><LoaderCircle className="spin" size={24}/> Loading your finances…</div> : <>
        {section === 'Overview' && <div className="content-grid">
          <div className="stat-grid">
            <StatCard title="Income this month" value={money(income)} icon={ArrowDownLeft} tone="green" caption="Money coming in"/>
            <StatCard title="Expenses this month" value={money(expenses)} icon={ArrowUpRight} tone="rose" caption="Money going out"/>
            <StatCard title="Net cash flow" value={money(balance)} icon={Wallet} tone="blue" caption="Income minus expenses"/>
            <StatCard title="Budget remaining" value={money(remaining)} icon={PiggyBank} tone="amber" caption={`${Math.round(expenses / Math.max(Number(budget), 1) * 100)}% of budget used`}/>
          </div>
          <section className="panel trend-panel"><PanelHeading title="Cash flow" subtitle="Income and expenses over the last six months"/><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData} margin={{left:0,right:8,top:12,bottom:0}}><defs><linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#31b89a" stopOpacity={0.22}/><stop offset="100%" stopColor="#31b89a" stopOpacity={0}/></linearGradient><linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7b88ff" stopOpacity={0.2}/><stop offset="100%" stopColor="#7b88ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#8791a5',fontSize:12}}/><YAxis axisLine={false} tickLine={false} tick={{fill:'#8791a5',fontSize:11}} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} width={38}/><Tooltip formatter={v => money(v)} contentStyle={{borderRadius:12,border:'1px solid #edf0f5',fontSize:12}}/><Area type="monotone" dataKey="income" name="Income" stroke="#31b89a" strokeWidth={2.5} fill="url(#incomeFill)"/><Area type="monotone" dataKey="expenses" name="Expenses" stroke="#7b88ff" strokeWidth={2.5} fill="url(#expenseFill)"/></AreaChart></ResponsiveContainer></div><div className="legend-row"><span><i className="legend-dot green-dot"/>Income</span><span><i className="legend-dot blue-dot"/>Expenses</span></div></section>
          <section className="panel category-panel"><PanelHeading title="Spending by category" subtitle="This month's expense breakdown"/>{categoryData.length ? <><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none">{categoryData.map((item,i)=><Cell key={item.name} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>money(v)}/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{money(expenses)}</strong><span>Total spent</span></div></div><div className="category-legend">{categoryData.slice(0,5).map((item,i)=><div key={item.name} className="category-line"><span><i className="legend-dot" style={{background:COLORS[i%COLORS.length]}}/>{item.name}</span><strong>{money(item.value)}</strong></div>)}</div></> : <EmptyState text="Add expenses to see your category breakdown."/>}</section>
          <section className="panel recent-panel"><PanelHeading title="Recent transactions" subtitle="Your latest money movements"/><TransactionList items={transactions.slice(0,5)} onDelete={deleteTransaction}/><button className="subtle-link" onClick={()=>setSection('Transactions')}>View all transactions <span>→</span></button></section>
        </div>}
        {section === 'Transactions' && <section className="panel transactions-panel"><div className="panel-heading"><div><h2>All transactions</h2><p>Review and manage your activity.</p></div><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All types</option><option value="expense">Expenses</option><option value="income">Income</option></select></div><TransactionList items={visibleTransactions} onDelete={deleteTransaction} emptyText="No transactions match this filter."/></section>}
        {section === 'Analytics' && <div className="content-grid analytics-grid"><section className="panel trend-panel"><PanelHeading title="Monthly trends" subtitle="Income compared with expenses"/><div className="chart-wrap tall"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e9edf4"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><YAxis axisLine={false} tickLine={false}/><Tooltip formatter={v=>money(v)}/><Area dataKey="income" name="Income" stroke="#31b89a" fill="#31b89a" fillOpacity={0.12}/><Area dataKey="expenses" name="Expenses" stroke="#7b88ff" fill="#7b88ff" fillOpacity={0.12}/></AreaChart></ResponsiveContainer></div></section><section className="panel"><PanelHeading title="Category totals" subtitle="Current month"/>{categoryData.length ? categoryData.map((item,i)=><div key={item.name} className="category-line"><span><i className="legend-dot" style={{background:COLORS[i%COLORS.length]}}/>{item.name}</span><strong>{money(item.value)}</strong></div>) : <EmptyState text="No expense data yet."/>}</section></div>}
        {section === 'Budget' && <section className="panel budget-panel"><PanelHeading title="Monthly budget" subtitle="Set a spending limit to stay on track"/><div className="budget-summary"><div><span className="muted">Spent this month</span><strong>{money(expenses)}</strong></div><div><span className="muted">Monthly limit</span><strong>{money(budget)}</strong></div><div><span className="muted">Left to spend</span><strong className={remaining === 0 ? 'text-rose' : 'text-green'}>{money(remaining)}</strong></div></div><div className="progress-track"><div className={expenses > budget ? 'progress-fill over' : 'progress-fill'} style={{width:`${Math.min(expenses/Math.max(Number(budget),1)*100,100)}%`}}/></div><p className="muted small">{Math.round(expenses/Math.max(Number(budget),1)*100)}% of your monthly budget used</p><form className="budget-form" onSubmit={saveBudget}><label>Set monthly budget (BDT)<input type="number" min="1" step="1" required value={budgetInput} onChange={e=>setBudgetInput(e.target.value)}/></label><button className="button primary">Save budget</button></form></section>}
      </>}
      <footer className="footer-note"><ShieldCheck size={15}/> Your data is private to your account. Amounts shown in Bangladeshi taka (BDT).</footer>
    </main>
    {showForm && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false)}}><section className="modal-card"><div className="panel-heading"><div><h2>Add transaction</h2><p>Record money in or money out.</p></div><button className="icon-button" onClick={()=>setShowForm(false)}><X size={19}/></button></div><form className="stack-form" onSubmit={addTransaction}><div className="segmented"><button type="button" className={form.type==='expense'?'selected':''} onClick={()=>setForm({...form,type:'expense',category:'Food & Dining'})}><ArrowUpRight size={16}/> Expense</button><button type="button" className={form.type==='income'?'selected':''} onClick={()=>setForm({...form,type:'income',category:'Salary'})}><ArrowDownLeft size={16}/> Income</button></div><label>Amount (BDT)<div className="amount-input"><span>৳</span><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></div></label><label>Description<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What was this for?"/></label><div className="form-row"><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.filter(c=>form.type==='income'?['Salary','Freelance','Other'].includes(c):!['Salary','Freelance'].includes(c)).map(c=><option key={c}>{c}</option>)}</select></label><label>Payment method<select value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>{['Cash','Card','Bank transfer','Mobile banking','Other'].map(x=><option key={x}>{x}</option>)}</select></label></div><label>Date<input required type="date" value={form.transaction_date} onChange={e=>setForm({...form,transaction_date:e.target.value})}/></label><div className="modal-actions"><button type="button" className="button secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving?'Saving…':'Save transaction'}</button></div></form></section></div>}
  </div>
}

function StatCard({ title, value, icon: Icon, tone, caption }) {
  return <section className="stat-card"><div className="stat-top"><span>{title}</span><span className={`stat-icon ${tone}`}><Icon size={18}/></span></div><strong className="stat-value">{value}</strong><span className="stat-caption">{caption}</span></section>
}
function PanelHeading({title,subtitle}) { return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div></div> }
function EmptyState({text}) { return <div className="empty-state"><CircleDollarSign size={27}/><p>{text}</p></div> }
function TransactionList({items,onDelete,emptyText='No transactions yet. Add your first one to get started.'}) {
  if (!items.length) return <EmptyState text={emptyText}/>
  return <div className="transaction-list">{items.map(t=><div className="transaction-row" key={t.id}><div className={`transaction-symbol ${t.type}`}>{t.type==='income'?<ArrowDownLeft size={18}/>:<ArrowUpRight size={18}/>}</div><div className="transaction-info"><strong>{t.description || t.category}</strong><span>{t.category} · {new Date(`${t.transaction_date}T12:00:00`).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})}</span></div><strong className={`transaction-amount ${t.type}`}>{t.type==='income'?'+':'−'}{money(t.amount)}</strong><button className="icon-button delete-button" title="Delete transaction" onClick={()=>onDelete(t.id)}><Trash2 size={16}/></button></div>)}</div>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    if (!supabase) { setChecking(false); return }
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setChecking(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session || !supabase) return
    let active = true
    supabase.from('profiles').select('id,full_name,role').eq('id',session.user.id).maybeSingle()
      .then(({data}) => { if(active) setProfile(data) })
    return () => { active = false }
  }, [session])
  async function signOut() { await supabase.auth.signOut() }
  if (!isSupabaseConfigured) return <SetupNotice/>
  if (checking) return <div className="loading full-screen"><LoaderCircle className="spin" size={24}/> Checking your session…</div>
  if (!session) return <AuthScreen/>
  return <AppShell key={session.user.id} session={session} profile={profile} onSignOut={signOut}/>
}

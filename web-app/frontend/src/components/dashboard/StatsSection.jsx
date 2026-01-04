import { Activity, Bell, Stethoscope, HeartPulse } from 'lucide-react'
import StatCard from './StatCard'

const StatsSection = () => (
  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
    <StatCard icon={Activity} label="Active Patients" value={249} sub={'+12 From This Week'} />
    <StatCard icon={Bell} label="Critical Alerts" value="3 Critical" sub="(•) Live" />
    <StatCard icon={Stethoscope} label="Pending Prescriptions" value={5} sub="Awaiting Doctor Approval" />
    <StatCard icon={HeartPulse} label="Low Stock Items" value="3" sub="Amoxicillin • Penicillin • Cithraxine" />
  </section>
)

export default StatsSection

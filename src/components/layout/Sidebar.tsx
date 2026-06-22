import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, FileClock, ShieldAlert,
  Store, FileSpreadsheet, Stethoscope, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const MENU = [
  { path: '/overview', label: '卡项总览', Icon: LayoutDashboard, key: 'overview' },
  { path: '/revenue', label: '收入确认', Icon: Receipt, key: 'revenue' },
  { path: '/redemption', label: '核销流水', Icon: FileClock, key: 'redemption' },
  { path: '/risk', label: '风险卡清单', Icon: ShieldAlert, key: 'risk' },
  { path: '/reconciliation', label: '门店对账', Icon: Store, key: 'recon' },
  { path: '/reports', label: '导出报表', Icon: FileSpreadsheet, key: 'reports' },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, riskCards, approvalRequests } = useAppStore();
  const location = useLocation();

  const pendingRiskCount = riskCards.filter(r => r.processingStatus === 'pending').length;
  const pendingApprovalCount = approvalRequests.filter(
    a => a.status === 'pending_finance' || a.status === 'pending_director'
  ).length;

  return (
    <aside
      className={`flex flex-col h-full transition-all duration-300 relative
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
        text-white`}
      style={{
        background: 'linear-gradient(180deg, #0F4C5C 0%, #052630 100%)',
      }}
    >
      <div className={`px-4 py-5 flex items-center gap-3 border-b border-white/10 ${sidebarCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
             style={{ background: 'linear-gradient(135deg, #84bfc6 0%, #31828b 100%)' }}>
          <Stethoscope size={18} className="text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="font-serif font-bold text-base leading-tight">疗程卡审计</div>
            <div className="text-[10px] text-primary-200/80 mt-0.5 tracking-wider">COURSE CARD AUDIT</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {MENU.map(({ path, label, Icon, key }) => {
            const active = location.pathname === path;
            const badge =
              key === 'risk' && pendingRiskCount > 0 ? pendingRiskCount :
              key === 'reports' && pendingApprovalCount > 0 ? pendingApprovalCount : 0;
            return (
              <NavLink
                key={path}
                to={path}
                className={`sidebar-item ${active ? 'active' : ''} ${sidebarCollapsed ? 'justify-center !px-2' : ''}`}
                title={label}
              >
                <div className="relative shrink-0">
                  <Icon size={18} />
                  {badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full
                      bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && <span className="flex-1 truncate">{label}</span>}
              </NavLink>
            );
          })}
        </div>

        {!sidebarCollapsed && (
          <div className="mx-4 mt-8 mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs text-primary-200/70 mb-2">本月对账健康度</div>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-serif font-bold text-primary-100">96.8%</span>
            </div>
            <div className="progress-track bg-white/10">
              <div
                className="progress-fill"
                style={{
                  width: '96.8%',
                  background: 'linear-gradient(90deg, #84bfc6 0%, #E36414 100%)',
                }}
              />
            </div>
          </div>
        )}
      </nav>

      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-12 rounded-r-lg
          bg-white border border-zinc-200 text-zinc-500 hover:text-primary-700 hover:shadow-md
          flex items-center justify-center transition-all z-10"
      >
        {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

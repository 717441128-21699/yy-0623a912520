import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell, Search, User, Calendar, ShieldCheck, Crown,
} from 'lucide-react';
import { useAppStore, type UserRole } from '@/store/useAppStore';
import { formatDate } from '@/utils/formatters';

const TITLE_MAP: Record<string, { title: string; desc: string; breadcrumb: string[] }> = {
  '/overview': { title: '卡项总览', desc: '按门店、项目、顾问统计售卡与未服务次数', breadcrumb: ['首页', '卡项总览'] },
  '/revenue': { title: '收入确认', desc: '预收账款分解，权责发生制下确认收入', breadcrumb: ['首页', '收入确认'] },
  '/redemption': { title: '核销流水', desc: '前台、收银、治疗单三方一致性核对', breadcrumb: ['首页', '核销流水'] },
  '/risk': { title: '风险卡清单', desc: '异常卡项识别、分级与处理留痕', breadcrumb: ['首页', '风险卡清单'] },
  '/reconciliation': { title: '门店对账', desc: '期初-期末余额轧差，履约压力评估', breadcrumb: ['首页', '门店对账'] },
  '/reports': { title: '导出报表与审批', desc: '月末报表导出，退款转卡审批留痕', breadcrumb: ['首页', '导出报表'] },
};

export const Header: React.FC = () => {
  const location = useLocation();
  const pageMeta = TITLE_MAP[location.pathname] || TITLE_MAP['/overview'];
  const { currentRole, setRole } = useAppStore();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200">
      <div className="flex items-center gap-4 px-6 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Calendar size={12} />
            <span>{formatDate(new Date().toISOString())}</span>
            <span className="text-zinc-300 mx-1">/</span>
            {pageMeta.breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-zinc-300 mx-1">›</span>}
                <span className={i === pageMeta.breadcrumb.length - 1 ? 'text-zinc-700 font-medium' : ''}>
                  {b}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div className="flex items-end gap-3">
            <h1 className="page-title">{pageMeta.title}</h1>
            <span className="text-xs text-zinc-500 pb-1.5 hidden md:inline">{pageMeta.desc}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100/70 border border-zinc-200 text-xs font-medium text-zinc-600">
            <Search size={14} className="text-zinc-400" />
            <span className="hidden lg:inline">全局搜索</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-[10px] text-zinc-400">
              Ctrl K
            </kbd>
          </div>

          <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1">
            {(['finance', 'director'] as UserRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setRole(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                  ${currentRole === role
                    ? 'text-white shadow-sm'
                    : 'text-zinc-600 hover:bg-zinc-50'}`}
                style={currentRole === role
                  ? { background: 'linear-gradient(135deg, #0F4C5C, #31828b)' }
                  : {}}
              >
                {role === 'finance' ? <ShieldCheck size={13} /> : <Crown size={13} />}
                <span className="hidden sm:inline">{role === 'finance' ? '财务视角' : '院长视角'}</span>
              </button>
            ))}
          </div>

          <button className="relative w-10 h-10 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-primary-700 flex items-center justify-center transition">
            <Bell size={17} />
            <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-accent-500"></span>
          </button>

          <div className="flex items-center gap-3 pl-2 border-l border-zinc-200">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium"
                 style={{ background: 'linear-gradient(135deg, #236871 0%, #0F4C5C 100%)' }}>
              <User size={16} />
            </div>
            <div className="hidden lg:block min-w-0">
              <div className="text-sm font-medium text-zinc-900 leading-tight">
                {currentRole === 'finance' ? '苏美玲' : '张建国'}
              </div>
              <div className="text-xs text-zinc-500 leading-tight mt-0.5">
                {currentRole === 'finance' ? '财务主管' : '院长 / 总经理'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

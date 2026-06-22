import React from 'react';
import { Search, RotateCcw, Calendar as CalendarIcon, Store, Layers, User2 } from 'lucide-react';

interface FilterOption { value: string; label: string; }

interface Props {
  stores?: FilterOption[];
  categories?: FilterOption[];
  consultants?: FilterOption[];
  selectedStoreIds: string[];
  selectedCategoryIds: string[];
  selectedConsultantIds: string[];
  dateFrom: string;
  dateTo: string;
  searchKeyword: string;
  onStoresChange: (ids: string[]) => void;
  onCategoriesChange: (ids: string[]) => void;
  onConsultantsChange: (ids: string[]) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onReset: () => void;
  showConsultant?: boolean;
  extraFilters?: React.ReactNode;
}

const MultiSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  options: FilterOption[];
  values: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}> = ({ label, icon, options, values, onChange, placeholder = '全部' }) => {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as any)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (v: string) => {
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-300 bg-white text-sm text-zinc-700 hover:border-primary-400 transition-all min-w-[150px] max-w-[220px]"
      >
        <span className="text-zinc-400">{icon}</span>
        <span className="flex-1 text-left truncate">
          {values.length === 0 ? placeholder : (
            <span className="text-zinc-900 font-medium">
              {options.find(o => o.value === values[0])?.label}{values.length > 1 ? ` +${values.length - 1}` : ''}
            </span>
          )}
        </span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[260px] max-h-64 overflow-y-auto scrollbar-thin z-30 bg-white border border-zinc-200 rounded-lg shadow-lg py-1">
          <div className="px-3 py-1.5 text-xs text-zinc-500 font-medium border-b border-zinc-100">
            {label}
          </div>
          {options.map(opt => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={values.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="w-4 h-4 text-primary-600 rounded border-zinc-300 focus:ring-primary-500"
              />
              <span className="text-zinc-700 flex-1">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export const FilterBar: React.FC<Props> = ({
  stores = [], categories = [], consultants = [],
  selectedStoreIds, selectedCategoryIds, selectedConsultantIds,
  dateFrom, dateTo, searchKeyword,
  onStoresChange, onCategoriesChange, onConsultantsChange,
  onDateFromChange, onDateToChange, onSearchChange, onReset,
  showConsultant = true, extraFilters,
}) => {
  return (
    <div className="card p-4 mb-5">
      <div className="flex items-center gap-3 flex-wrap">
        {stores.length > 0 && (
          <MultiSelect
            label="门店"
            icon={<Store size={16} />}
            options={stores}
            values={selectedStoreIds}
            onChange={onStoresChange}
            placeholder="全部门店"
          />
        )}
        {categories.length > 0 && (
          <MultiSelect
            label="项目类别"
            icon={<Layers size={16} />}
            options={categories}
            values={selectedCategoryIds}
            onChange={onCategoriesChange}
            placeholder="全部类别"
          />
        )}
        {showConsultant && consultants.length > 0 && (
          <MultiSelect
            label="销售顾问"
            icon={<User2 size={16} />}
            options={consultants}
            values={selectedConsultantIds}
            onChange={onConsultantsChange}
            placeholder="全部顾问"
          />
        )}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-zinc-300 bg-white">
          <CalendarIcon size={16} className="text-zinc-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="bg-transparent text-sm outline-none w-[130px] text-zinc-700"
          />
          <span className="text-zinc-400">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="bg-transparent text-sm outline-none w-[130px] text-zinc-700"
          />
        </div>
        {extraFilters}
        <div className="flex-1 min-w-[200px] max-w-[320px] ml-auto">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索卡号 / 顾客姓名 / 项目..."
              className="input pl-9"
            />
          </div>
        </div>
        <button onClick={onReset} className="btn-ghost">
          <RotateCcw size={14} />
          重置
        </button>
      </div>
    </div>
  );
};

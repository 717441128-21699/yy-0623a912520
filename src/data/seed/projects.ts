import type { Project } from '@/shared/types';

export const PROJECTS: Project[] = [
  { id: 'PJ001', name: '热玛吉FLX-面部', categoryId: 'CAT01', categoryName: '光电抗衰' },
  { id: 'PJ002', name: '超声炮-全面部', categoryId: 'CAT01', categoryName: '光电抗衰' },
  { id: 'PJ003', name: '欧洲之星Fotona 4D', categoryId: 'CAT01', categoryName: '光电抗衰' },
  { id: 'PJ004', name: 'M22光子嫩肤', categoryId: 'CAT02', categoryName: '光电美肤' },
  { id: 'PJ005', name: '皮秒祛斑', categoryId: 'CAT02', categoryName: '光电美肤' },
  { id: 'PJ006', name: '黄金微针', categoryId: 'CAT02', categoryName: '光电美肤' },
  { id: 'PJ007', name: '玻尿酸填充-乔雅登', categoryId: 'CAT03', categoryName: '注射美容' },
  { id: 'PJ008', name: '肉毒素除皱-保妥适', categoryId: 'CAT03', categoryName: '注射美容' },
  { id: 'PJ009', name: '瘦脸针-衡力', categoryId: 'CAT03', categoryName: '注射美容' },
  { id: 'PJ010', name: '水光针基础款', categoryId: 'CAT04', categoryName: '中胚层疗法' },
  { id: 'PJ011', name: '动能素微针', categoryId: 'CAT04', categoryName: '中胚层疗法' },
  { id: 'PJ012', name: '果酸焕肤', categoryId: 'CAT05', categoryName: '皮肤管理' },
  { id: 'PJ013', name: '小气泡清洁', categoryId: 'CAT05', categoryName: '皮肤管理' },
  { id: 'PJ014', name: '眼部综合护理', categoryId: 'CAT05', categoryName: '皮肤管理' },
];

export const CATEGORIES = [
  { id: 'CAT01', name: '光电抗衰', color: '#0F4C5C' },
  { id: 'CAT02', name: '光电美肤', color: '#236871' },
  { id: 'CAT03', name: '注射美容', color: '#E36414' },
  { id: 'CAT04', name: '中胚层疗法', color: '#509ea7' },
  { id: 'CAT05', name: '皮肤管理', color: '#84bfc6' },
];

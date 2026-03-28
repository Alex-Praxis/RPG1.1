// ── CONSTANTS ──
export const SCORES = {N:-10, A:2, B:5, C:30, D:150};
export const TYPE_LABELS = {time:'时间奖励', exp:'体验消费', item:'实物消费'};
export const TYPE_COLORS = {N:'var(--red)', A:'var(--text2)', B:'var(--amber)', C:'var(--blue)', D:'var(--purple)'};
export const typeLabels  = {N:'噪声', A:'基线维持', B:'小改善', C:'核心/复利', D:'极限考验'};
export const TARGET = new Date('2028-03-06');
export const JSONBIN = 'https://api.jsonbin.io/v3/b';

// ── DEFAULT DATA ──
export const DEFAULT_REWARDS = [
  {id:'001',name:'热毛巾敷脸',cost:5,rmb:0,min:5,type:'time',archived:false},
  {id:'002',name:'饮料',cost:7,rmb:5,min:2,type:'exp',archived:false},
  {id:'003',name:'阅读小说 1 章',cost:6,rmb:0,min:6,type:'time',archived:false},
  {id:'004',name:'新疆天润酸奶；光明酸奶',cost:12,rmb:10,min:2,type:'exp',archived:false},
  {id:'005',name:'DP',cost:35,rmb:0,min:35,type:'time',archived:false},
  {id:'007',name:'咖啡厅',cost:32,rmb:30,min:2,type:'exp',archived:false},
  {id:'008',name:'动画片《成功的原则》',cost:60,rmb:0,min:60,type:'time',archived:false},
  {id:'009',name:'电影：飞黄腾达',cost:150,rmb:0,min:150,type:'exp',archived:false},
  {id:'010',name:'郑远元 60min',cost:168,rmb:80,min:88,type:'exp',archived:false},
  {id:'011',name:'乔斯同款上衣',cost:530,rmb:30,min:500,type:'item',archived:false},
  {id:'012',name:'莫曼顿自行车',cost:3120,rmb:120,min:3000,type:'item',archived:false},
  {id:'013',name:'Airpods Max',cost:4030,rmb:4000,min:30,type:'item',archived:false},
  {id:'014',name:'全身镜',cost:245,rmb:200,min:45,type:'item',archived:false},
  {id:'015',name:'茶杯',cost:180,rmb:150,min:30,type:'item',archived:false},
  {id:'016',name:'床边桌',cost:459,rmb:399,min:60,type:'item',archived:false},
  {id:'017',name:'Mac mini',cost:5060,rmb:5000,min:60,type:'item',archived:false},
  {id:'018',name:'门挂钩',cost:30,rmb:20,min:10,type:'item',archived:false},
  {id:'019',name:'游戏电脑',cost:10120,rmb:10000,min:120,type:'item',archived:false},
  {id:'020',name:'养肝茶',cost:45,rmb:30,min:15,type:'exp',archived:false},
  {id:'022',name:'林源春冰白葡萄汁',cost:80,rmb:60,min:20,type:'exp',archived:false},
  {id:'025',name:'极简衣架',cost:430,rmb:400,min:30,type:'item',archived:false},
];

export const DEFAULT_BUDGET = [
  {name:'住房及水电燃气',amount:500},
  {name:'衣服',amount:600},
  {name:'饮食',amount:2000},
  {name:'请客吃饭',amount:1000},
  {name:'人情往来',amount:500},
  {name:'菊敏',amount:400},
  {name:'交通',amount:500},
  {name:'杂项',amount:200},
];

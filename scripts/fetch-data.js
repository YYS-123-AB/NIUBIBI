const https = require('https');
const fs = require('fs');
const path = require('path');

const DATA_URL = 'https://raw.githubusercontent.com/example/zodiac-data/main/data.json';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'data.json');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function fetchData(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          resolve(fetchData(redirectUrl));
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function generateSampleData() {
  const zodiacSigns = [
    {
      id: 1, signKey: 'aries', name: '白羊座', enName: 'Aries', symbol: '♈', symbolEmoji: '🐏',
      dateRange: '3月21日-4月19日', guardianPlanet: '火星', element: '火', elementEmoji: '🔥',
      oppositeSign: '天秤座', luckyColor: '红色', luckyNumber: '9', luckyJewelry: '红宝石',
      personality: '白羊座的人热情冲动、爱冒险、慷慨，天不怕地不怕。而且一旦下定决心，不到黄河心不死，排除万难也要达到目的。',
      strengths: ['积极坦白', '热爱自由', '行动力强', '勇敢果断', '乐观向上'],
      weaknesses: ['急躁冲动', '粗心大意', '缺乏耐心', '好斗冲动', '三分钟热度'],
      bestMatches: ['狮子座', '射手座', '双子座'],
      worstMatches: ['摩羯座', '巨蟹座', '金牛座'],
      loveCompatibility: [
        { sign: '金牛座', score: 65 }, { sign: '双子座', score: 90 }, { sign: '巨蟹座', score: 55 },
        { sign: '狮子座', score: 95 }, { sign: '处女座', score: 60 }, { sign: '天秤座', score: 75 },
        { sign: '天蝎座', score: 70 }, { sign: '射手座', score: 92 }, { sign: '摩羯座', score: 50 },
        { sign: '水瓶座', score: 85 }, { sign: '双鱼座', score: 68 }
      ],
      fortunes: {
        today: { total: 85, love: 88, career: 82, wealth: 78, health: 85, text: ['今天整体运势相当不错，火星为你注入满满的能量。', '工作上会遇到一些挑战，但你的行动力能帮助解决。', '感情方面桃花运旺盛，单身者有机会遇到心仪对象。'] },
        week: { total: 80, love: 82, career: 78, wealth: 75, health: 83, text: ['本周整体运势稳步上升，热情感染身边的人。', '工作中有新机遇，保持专注不要被干扰。', '周末适合放松身心，约好友外出活动。'] },
        month: { total: 78, love: 80, career: 76, wealth: 72, health: 80, text: ['本月整体运势平稳向好，火星正面影响让你充满斗志。', '事业上会有贵人相助，主动出击抓住机会。', '财运正财稳定，投资前做好调研。'] },
        year: { total: 82, love: 85, career: 80, wealth: 78, health: 84, text: ['今年是白羊座展现自我的一年，木星带来扩张机遇。', '事业运旺盛，有升职加薪机会。', '感情生活丰富多彩，年底有不错积蓄。'] },
        loveOnly: { total: 88, text: ['白羊座在爱情中热情似火，敢于追求幸福。', '恋爱中愿意付出，但也要给彼此空间。', '单身者近期桃花运旺盛，多参加社交活动。'] },
        careerOnly: { total: 82, text: ['白羊座是天生的领导者，工作充满干劲。', '近期事业有新突破，创意执行力受赏识。', '建议多些耐心细心，细节决定成败。'] },
        wealthOnly: { total: 78, text: ['白羊座财运起伏大，赚钱能力强消费也高。', '近期正财稳定，偏财不宜冒进。', '建议养成记账习惯，控制不必要开支。'] },
        healthOnly: { total: 85, text: ['白羊座精力充沛，但容易过度消耗自己。', '近期注意头部保养，避免熬夜。', '建议保持规律运动，学会放松心态。'] }
      },
      tarotId: 0, relatedIds: [5, 9]
    }
  ];

  const tarotCards = [
    { id: 0, name: '愚者', enName: 'The Fool', img: '🃏', uprightMeaning: ['新的开始', '冒险精神', '天真无邪'], reversedMeaning: ['鲁莽冲动', '不负责任', '过于天真'], keywords: ['开始', '冒险', '纯真'] },
    { id: 1, name: '魔术师', enName: 'The Magician', img: '🎩', uprightMeaning: ['创造力', '意志力', '技能展现'], reversedMeaning: ['欺骗操纵', '技能不足', '意志力薄弱'], keywords: ['创造', '意志', '行动'] }
  ];

  const signTemplates = [
    { key: 'taurus', name: '金牛座', enName: 'Taurus', symbol: '♉', emoji: '🐂', date: '4月20日-5月20日', guardian: '金星', elem: '土', elemEmoji: '🌍', opposite: '天蝎座', color: '绿色', num: '6', jewelry: '翡翠', ids: [6, 10] },
    { key: 'gemini', name: '双子座', enName: 'Gemini', symbol: '♊', emoji: '👯', date: '5月21日-6月21日', guardian: '水星', elem: '风', elemEmoji: '💨', opposite: '射手座', color: '黄色', num: '5', jewelry: '黄水晶', ids: [7, 11] },
    { key: 'cancer', name: '巨蟹座', enName: 'Cancer', symbol: '♋', emoji: '🦀', date: '6月22日-7月22日', guardian: '月亮', elem: '水', elemEmoji: '💧', opposite: '摩羯座', color: '白色', num: '2', jewelry: '珍珠', ids: [8, 12] },
    { key: 'leo', name: '狮子座', enName: 'Leo', symbol: '♌', emoji: '🦁', date: '7月23日-8月22日', guardian: '太阳', elem: '火', elemEmoji: '🔥', opposite: '水瓶座', color: '金色', num: '1', jewelry: '钻石', ids: [1, 9] },
    { key: 'virgo', name: '处女座', enName: 'Virgo', symbol: '♍', emoji: '👰', date: '8月23日-9月22日', guardian: '水星', elem: '土', elemEmoji: '🌍', opposite: '双鱼座', color: '灰色', num: '7', jewelry: '蓝宝石', ids: [2, 10] },
    { key: 'libra', name: '天秤座', enName: 'Libra', symbol: '♎', emoji: '⚖️', date: '9月23日-10月23日', guardian: '金星', elem: '风', elemEmoji: '💨', opposite: '白羊座', color: '粉色', num: '3', jewelry: '粉晶', ids: [3, 11] },
    { key: 'scorpio', name: '天蝎座', enName: 'Scorpio', symbol: '♏', emoji: '🦂', date: '10月24日-11月22日', guardian: '冥王星', elem: '水', elemEmoji: '💧', opposite: '金牛座', color: '紫色', num: '4', jewelry: '紫水晶', ids: [4, 12] },
    { key: 'sagittarius', name: '射手座', enName: 'Sagittarius', symbol: '♐', emoji: '🏹', date: '11月23日-12月21日', guardian: '木星', elem: '火', elemEmoji: '🔥', opposite: '双子座', color: '蓝色', num: '8', jewelry: '绿松石', ids: [1, 5] },
    { key: 'capricorn', name: '摩羯座', enName: 'Capricorn', symbol: '♑', emoji: '🐐', date: '12月22日-1月19日', guardian: '土星', elem: '土', elemEmoji: '🌍', opposite: '巨蟹座', color: '咖啡色', num: '10', jewelry: '黑玛瑙', ids: [2, 6] },
    { key: 'aquarius', name: '水瓶座', enName: 'Aquarius', symbol: '♒', emoji: '🏺', date: '1月20日-2月18日', guardian: '天王星', elem: '风', elemEmoji: '💨', opposite: '狮子座', color: '古铜色', num: '11', jewelry: '蛋白石', ids: [3, 7] },
    { key: 'pisces', name: '双鱼座', enName: 'Pisces', symbol: '♓', emoji: '🐟', date: '2月19日-3月20日', guardian: '海王星', elem: '水', elemEmoji: '💧', opposite: '处女座', color: '海蓝色', num: '12', jewelry: '海蓝宝', ids: [4, 8] }
  ];

  const fullZodiac = [...zodiacSigns];
  signTemplates.forEach((t, idx) => {
    const id = idx + 2;
    const baseScore = 75 + Math.floor(Math.random() * 15);
    const template = zodiacSigns[0];
    const loveCompat = zodiacSigns[0].loveCompatibility.map(lc => ({
      ...lc,
      score: Math.max(45, Math.min(98, lc.score + Math.floor(Math.random() * 10) - 5))
    }));
    fullZodiac.push({
      id, signKey: t.key, name: t.name, enName: t.enName, symbol: t.symbol, symbolEmoji: t.emoji,
      dateRange: t.date, guardianPlanet: t.guardian, element: t.elem, elementEmoji: t.elemEmoji,
      oppositeSign: t.opposite, luckyColor: t.color, luckyNumber: t.num, luckyJewelry: t.jewelry,
      personality: `${t.name}的人性格独特，有着${t.elem}象星座特有的气质。受${t.guardian}守护，他们在生活中展现出与众不同的魅力和特质，是十二星座中不可或缺的存在。`,
      strengths: [...template.strengths],
      weaknesses: [...template.weaknesses],
      bestMatches: template.bestMatches.map(m => zodiacSigns.find(z => z.name === m)?.name || m),
      worstMatches: template.worstMatches,
      loveCompatibility: loveCompat,
      fortunes: {
        today: { ...template.fortunes.today, total: baseScore, love: baseScore + 3, career: baseScore - 2, wealth: baseScore - 5, health: baseScore },
        week: { ...template.fortunes.week, total: baseScore - 5, love: baseScore - 3, career: baseScore - 4, wealth: baseScore - 8, health: baseScore - 2 },
        month: { ...template.fortunes.month, total: baseScore - 7, love: baseScore - 5, career: baseScore - 9, wealth: baseScore - 11, health: baseScore - 5 },
        year: { ...template.fortunes.year, total: baseScore - 3, love: baseScore, career: baseScore - 5, wealth: baseScore - 7, health: baseScore - 1 },
        loveOnly: { ...template.fortunes.loveOnly, total: baseScore + 5 },
        careerOnly: { ...template.fortunes.careerOnly, total: baseScore - 3 },
        wealthOnly: { ...template.fortunes.wealthOnly, total: baseScore - 7 },
        healthOnly: { ...template.fortunes.healthOnly, total: baseScore }
      },
      tarotId: id % 2, relatedIds: t.ids
    });
  });

  const allTarot = [...tarotCards];
  const tarotNames = [
    ['女祭司', 'The High Priestess', '🌙', ['直觉敏锐', '潜意识', '神秘智慧'], ['忽视直觉', '秘密泄露', '表面肤浅'], ['直觉', '神秘', '智慧']],
    ['皇后', 'The Empress', '👑', ['丰饶孕育', '母性关怀', '创造力'], ['依赖过度', '创造力受阻', '物质至上'], ['丰饶', '母性', '艺术']],
    ['皇帝', 'The Emperor', '⚔️', ['权威统治', '稳定秩序', '理性自律'], ['专制独裁', '控制过度', '僵化刻板'], ['权威', '稳定', '领导']],
    ['教皇', 'The Hierophant', '⛪', ['传统信仰', '精神导师', '学习教诲'], ['打破传统', '束缚教条', '信念动摇'], ['传统', '信仰', '教导']],
    ['恋人', 'The Lovers', '💕', ['爱情结合', '重大抉择', '和谐统一'], ['关系失和', '错误选择', '价值观冲突'], ['爱情', '选择', '和谐']],
    ['战车', 'The Chariot', '🏇', ['胜利前进', '意志力强', '控制局面'], ['失控失败', '方向不明', '被情绪左右'], ['胜利', '意志', '控制']],
    ['力量', 'Strength', '🦁', ['内心力量', '勇气耐心', '温柔坚定'], ['软弱无力', '自我怀疑', '脾气失控'], ['力量', '勇气', '耐心']],
    ['隐士', 'The Hermit', '🔦', ['内省寻找', '独自探索', '智慧指引'], ['孤独孤立', '逃避现实', '迷失方向'], ['内省', '智慧', '独处']],
    ['命运之轮', 'Wheel of Fortune', '🎡', ['命运转机', '好运来临', '变化循环'], ['厄运阻碍', '抗拒变化', '恶性循环'], ['命运', '变化', '转机']],
    ['正义', 'Justice', '⚖️', ['公正公平', '真相大白', '理性判断'], ['不公偏见', '逃避责任', '判断失误'], ['公正', '真相', '平衡']],
    ['倒吊人', 'The Hanged Man', '🙃', ['换角度看', '暂停等待', '牺牲奉献'], ['徒劳无功', '执迷不悟', '拖延停滞'], ['暂停', '视角', '牺牲']],
    ['死神', 'Death', '💀', ['结束重生', '彻底转变', '放下过去'], ['抗拒变化', '无法放下', '停滞不前'], ['结束', '重生', '转变']],
    ['节制', 'Temperance', '🍷', ['平衡调和', '适度节制', '耐心等待'], ['失衡过度', '缺乏耐心', '极端行为'], ['平衡', '调和', '适度']],
    ['恶魔', 'The Devil', '😈', ['欲望束缚', '物质沉迷', '诱惑陷阱'], ['摆脱束缚', '解脱觉醒', '戒除瘾癖'], ['欲望', '束缚', '诱惑']],
    ['塔', 'The Tower', '🗼', ['突发巨变', '颠覆崩塌', '真相揭露'], ['避免灾难', '延缓巨变', '内心动摇'], ['突变', '崩塌', '觉醒']],
    ['星星', 'The Star', '⭐', ['希望光明', '信心恢复', '灵感涌现'], ['失去希望', '信心丧失', '理想幻灭'], ['希望', '信仰', '治愈']],
    ['月亮', 'The Moon', '🌕', ['幻觉迷茫', '隐藏恐惧', '潜意识'], ['拨云见日', '破除幻觉', '真相浮现'], ['幻觉', '恐惧', '潜意识']],
    ['太阳', 'The Sun', '☀️', ['成功喜悦', '光明幸福', '活力充沛'], ['暂时阴霾', '过度乐观', '虚假成功'], ['成功', '快乐', '光明']],
    ['审判', 'Judgement', '📯', ['觉醒重生', '重大决断', '召唤使命'], ['自我怀疑', '拒绝觉醒', '错过机会'], ['觉醒', '审判', '重生']],
    ['世界', 'The World', '🌍', ['圆满完成', '整合统一', '成功达成'], ['未竟之事', '缺乏闭环', '功亏一篑'], ['完成', '圆满', '成功']]
  ];
  tarotNames.forEach((t, i) => {
    allTarot.push({
      id: i + 2, name: t[0], enName: t[1], img: t[2],
      uprightMeaning: t[3], reversedMeaning: t[4], keywords: t[5]
    });
  });

  return { zodiacSigns: fullZodiac, tarotCards: allTarot };
}

async function main() {
  ensureDir(path.dirname(OUTPUT_PATH));
  console.log('📡 正在获取星座数据...');

  try {
    const data = await fetchData(DATA_URL);
    if (data && data.zodiacSigns && data.zodiacSigns.length >= 12) {
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✅ 成功从远程获取数据，写入 ${OUTPUT_PATH}`);
      console.log(`   - 星座数据: ${data.zodiacSigns.length} 个`);
      console.log(`   - 塔罗牌: ${data.tarotCards?.length || 0} 张`);
      return;
    }
    throw new Error('Data incomplete');
  } catch (err) {
    console.log(`⚠️  远程获取失败: ${err.message}`);
    console.log('📝 正在生成示例数据...');
  }

  const sampleData = generateSampleData();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sampleData, null, 2), 'utf8');
  console.log(`✅ 成功生成示例数据，写入 ${OUTPUT_PATH}`);
  console.log(`   - 星座数据: ${sampleData.zodiacSigns.length} 个`);
  console.log(`   - 塔罗牌: ${sampleData.tarotCards.length} 张`);
}

main().catch(err => {
  console.error('❌ 执行失败:', err.message);
  process.exit(1);
});

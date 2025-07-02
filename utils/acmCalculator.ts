import { HealthData } from '../hooks/useHealthData';

export interface ACMScore {
  overall: number; // 总体健康分数 0-100
  breakdown: {
    cardiovascular: number; // 心血管健康
    metabolic: number; // 代谢健康
    activity: number; // 活动水平
    lifestyle: number; // 生活方式
  };
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  recommendations: string[];
}

// 基于科学研究的风险评估标准
const RISK_FACTORS = {
  // 静息心率风险评分 (基于Framingham研究)
  restingHeartRate: {
    excellent: { min: 40, max: 60 }, // 运动员水平
    good: { min: 60, max: 70 }, // 健康水平
    fair: { min: 70, max: 80 }, // 平均水平
    poor: { min: 80, max: 100 }, // 需要改善
    dangerous: { min: 100, max: 200 }, // 高风险
  },

  // BMI风险评分
  bmi: {
    underweight: { min: 0, max: 18.5 },
    normal: { min: 18.5, max: 25 },
    overweight: { min: 25, max: 30 },
    obese: { min: 30, max: 100 },
  },

  // 年龄相关的风险调整
  ageMultipliers: {
    young: { min: 18, max: 30, multiplier: 1.0 }, // 年轻群体
    adult: { min: 30, max: 50, multiplier: 1.1 }, // 成年群体
    middleAge: { min: 50, max: 65, multiplier: 1.3 }, // 中年群体
    senior: { min: 65, max: 100, multiplier: 1.5 }, // 老年群体
  },
};

// 计算心血管健康分数
function calculateCardiovascularScore(data: HealthData): number {
  let score = 100;

  // 静息心率评分 (权重: 40%)
  if (data.restingHeartRate) {
    const rhr = data.restingHeartRate;
    if (rhr >= 100) score -= 25;
    else if (rhr >= 80) score -= 15;
    else if (rhr >= 70) score -= 8;
    else if (rhr >= 60) score -= 2;
    // 40-60 范围不减分，甚至可以加分
    if (rhr >= 40 && rhr <= 55) score += 5;
  }

  // 当前心率评分 (权重: 20%) - 静息状态下的即时心率
  if (data.heartRate && data.restingHeartRate) {
    const heartRateVariability = Math.abs(data.heartRate - data.restingHeartRate);
    if (heartRateVariability > 30) score -= 10; // 心率变异性过大
  }

  // 血压评分 (权重: 40%) - 暂时无法获取，预留
  // 理想血压: 收缩压 < 120, 舒张压 < 80

  return Math.max(0, Math.min(100, score));
}

// 计算代谢健康分数
function calculateMetabolicScore(data: HealthData): number {
  let score = 100;

  // BMI评分 (权重: 60%)
  if (data.bmi) {
    const bmi = data.bmi;
    if (bmi < 18.5)
      score -= 15; // 体重过轻
    else if (bmi >= 30)
      score -= 30; // 肥胖
    else if (bmi >= 25)
      score -= 15; // 超重
    else if (bmi >= 18.5 && bmi <= 24.9) score += 10; // 理想BMI
  } else if (data.weight && data.height) {
    // 如果没有BMI数据，手动计算
    const heightInM = data.height / 100;
    const calculatedBMI = data.weight / (heightInM * heightInM);

    if (calculatedBMI < 18.5) score -= 15;
    else if (calculatedBMI >= 30) score -= 30;
    else if (calculatedBMI >= 25) score -= 15;
    else score += 10;
  }

  // 体重合理性评分 (权重: 40%)
  if (data.weight && data.height && data.age && data.biologicalSex) {
    const heightInM = data.height / 100;
    const idealWeight =
      data.biologicalSex === 'male' ? (heightInM - 1) * 100 * 0.9 : (heightInM - 1) * 100 * 0.85;

    const weightDifference = Math.abs(data.weight - idealWeight) / idealWeight;
    if (weightDifference > 0.3) score -= 20;
    else if (weightDifference > 0.15) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

// 计算活动水平分数
function calculateActivityScore(data: HealthData): number {
  let score = 100;

  // 日步数评分 (权重: 50%)
  if (data.stepCount !== null) {
    const steps = data.stepCount;
    if (steps < 3000)
      score -= 40; // 久坐不动
    else if (steps < 5000)
      score -= 25; // 活动不足
    else if (steps < 7000)
      score -= 10; // 轻度活动
    else if (steps >= 10000)
      score += 15; // 活跃
    else if (steps >= 12000) score += 20; // 非常活跃
  }

  // 活跃能量消耗评分 (权重: 50%)
  if (data.activeEnergyBurned !== null) {
    const calories = data.activeEnergyBurned;
    // 基于年龄和性别的目标卡路里消耗
    let targetCalories = 300; // 基础目标

    if (data.age && data.biologicalSex) {
      if (data.age < 30) targetCalories = 400;
      else if (data.age < 50) targetCalories = 350;
      else targetCalories = 250;

      if (data.biologicalSex === 'male') targetCalories *= 1.2;
    }

    const calorieRatio = calories / targetCalories;
    if (calorieRatio < 0.3) score -= 30;
    else if (calorieRatio < 0.6) score -= 15;
    else if (calorieRatio >= 1.2) score += 15;
    else if (calorieRatio >= 1.5) score += 20;
  }

  return Math.max(0, Math.min(100, score));
}

// 计算生活方式分数 (基于可获得的间接指标)
function calculateLifestyleScore(data: HealthData): number {
  let score = 100;

  // 年龄相关的基础健康调整
  if (data.age) {
    const age = data.age;
    if (age >= 65)
      score -= 15; // 老年群体基础风险
    else if (age >= 50)
      score -= 8; // 中年群体基础风险
    else if (age < 25) score -= 5; // 年轻群体可能的不良习惯
  }

  // 性别相关的统计风险调整 (基于流行病学数据)
  if (data.biologicalSex === 'male') {
    score -= 5; // 男性统计上有更高的心血管风险
  }

  // 健康数据完整性奖励 (积极监测健康的行为)
  let dataCompleteness = 0;
  const healthMetrics = [
    data.stepCount,
    data.heartRate,
    data.weight,
    data.height,
    data.restingHeartRate,
    data.activeEnergyBurned,
  ];

  healthMetrics.forEach((metric) => {
    if (metric !== null && metric > 0) dataCompleteness++;
  });

  const completenessRatio = dataCompleteness / healthMetrics.length;
  if (completenessRatio >= 0.8) score += 10; // 健康监测积极性奖励

  return Math.max(0, Math.min(100, score));
}

// 应用年龄和性别风险调整因子
function applyDemographicAdjustments(score: number, data: HealthData): number {
  let adjustedScore = score;

  if (data.age) {
    const age = data.age;
    let ageMultiplier = 1.0;

    if (age >= 65)
      ageMultiplier = 0.85; // 老年群体风险增加
    else if (age >= 50)
      ageMultiplier = 0.9; // 中年群体轻微风险增加
    else if (age >= 30)
      ageMultiplier = 0.95; // 成年群体基线
    else ageMultiplier = 1.0; // 年轻群体基线

    adjustedScore *= ageMultiplier;
  }

  return Math.max(0, Math.min(100, adjustedScore));
}

// 确定风险等级
function determineRiskLevel(score: number): ACMScore['riskLevel'] {
  if (score >= 85) return 'low';
  else if (score >= 70) return 'moderate';
  else if (score >= 50) return 'high';
  else return 'very-high';
}

// 生成个性化建议
function generateRecommendations(data: HealthData, breakdown: ACMScore['breakdown']): string[] {
  const recommendations: string[] = [];

  // 心血管建议
  if (breakdown.cardiovascular < 70) {
    if (data.restingHeartRate && data.restingHeartRate > 80) {
      recommendations.push('🏃‍♂️ 增加有氧运动，降低静息心率');
    }
    recommendations.push('❤️ 定期监测血压和心率');
  }

  // 代谢建议
  if (breakdown.metabolic < 70) {
    if (data.bmi && data.bmi > 25) {
      recommendations.push('⚖️ 控制体重，保持健康BMI');
    }
    recommendations.push('🥗 注意饮食平衡，减少加工食品');
  }

  // 活动建议
  if (breakdown.activity < 70) {
    if (data.stepCount !== null && data.stepCount < 7000) {
      recommendations.push('🚶‍♀️ 增加日常步数，目标每天10000步');
    }
    recommendations.push('💪 加入力量训练，每周2-3次');
  }

  // 生活方式建议
  if (breakdown.lifestyle < 70) {
    recommendations.push('😴 保证充足睡眠，每天7-9小时');
    recommendations.push('🧘‍♀️ 学习压力管理技巧');
  }

  // 通用建议
  if (recommendations.length === 0) {
    recommendations.push('🌟 继续保持健康的生活方式！');
    recommendations.push('📊 定期监测健康指标');
  }

  return recommendations.slice(0, 4); // 最多显示4条建议
}

// 主要的ACM计算函数
export function calculateACMScore(data: HealthData): ACMScore {
  // 计算各维度分数
  const cardiovascular = calculateCardiovascularScore(data);
  const metabolic = calculateMetabolicScore(data);
  const activity = calculateActivityScore(data);
  const lifestyle = calculateLifestyleScore(data);

  // 计算加权总分
  const weightedScore =
    cardiovascular * 0.35 + // 心血管健康 35%
    metabolic * 0.25 + // 代谢健康 25%
    activity * 0.25 + // 活动水平 25%
    lifestyle * 0.15; // 生活方式 15%

  // 应用人口统计学调整
  const adjustedScore = applyDemographicAdjustments(weightedScore, data);

  const breakdown = {
    cardiovascular: Math.round(cardiovascular),
    metabolic: Math.round(metabolic),
    activity: Math.round(activity),
    lifestyle: Math.round(lifestyle),
  };

  const overall = Math.round(adjustedScore);
  const riskLevel = determineRiskLevel(overall);
  const recommendations = generateRecommendations(data, breakdown);

  return {
    overall,
    breakdown,
    riskLevel,
    recommendations,
  };
}

// 获取分数对应的颜色
export function getScoreColor(score: number): string {
  if (score >= 85)
    return '#10B981'; // 绿色 - 优秀
  else if (score >= 70)
    return '#F59E0B'; // 黄色 - 良好
  else if (score >= 50)
    return '#EF4444'; // 红色 - 需要改善
  else return '#DC2626'; // 深红色 - 高风险
}

// 获取风险等级描述
export function getRiskLevelDescription(riskLevel: ACMScore['riskLevel']): string {
  switch (riskLevel) {
    case 'low':
      return '低风险';
    case 'moderate':
      return '中等风险';
    case 'high':
      return '高风险';
    case 'very-high':
      return '极高风险';
    default:
      return '未知';
  }
}

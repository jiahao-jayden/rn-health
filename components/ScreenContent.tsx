import React, { useMemo } from 'react'
import { Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useHealthData } from '../hooks/useHealthData'
import { calculateACMScore } from '../utils/acmCalculator'
import { HealthScoreRing } from './HealthScoreRing'
import { HealthMetricsGrid, HealthRecommendationCard, ScoreBredownCard } from './HealthMetricCard'
import type { HealthMetricCardProps } from './HealthMetricCard'

type ScreenContentProps = {
  title: string
  path: string
  children?: React.ReactNode
}

// 确定健康指标状态
const getMetricStatus = (value: number | null, type: string): HealthMetricCardProps['status'] => {
  if (value === null) return 'unknown'

  switch (type) {
    case 'restingHeartRate':
      if (value <= 60) return 'excellent'
      if (value <= 70) return 'good'
      if (value <= 80) return 'fair'
      return 'poor'

    case 'bmi':
      if (value >= 18.5 && value <= 24.9) return 'excellent'
      if (value >= 25 && value <= 29.9) return 'fair'
      return 'poor'

    case 'stepCount':
      if (value >= 10000) return 'excellent'
      if (value >= 7000) return 'good'
      if (value >= 5000) return 'fair'
      return 'poor'

    case 'activeEnergy':
      if (value >= 400) return 'excellent'
      if (value >= 300) return 'good'
      if (value >= 200) return 'fair'
      return 'poor'

    default:
      return 'unknown'
  }
}

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
  const { data, loading, error, hasPermissions, refreshData } = useHealthData()

  // 计算ACM分数
  const acmScore = useMemo(() => {
    return calculateACMScore(data)
  }, [data])

  // 准备健康指标数据
  const healthMetrics: Omit<HealthMetricCardProps, 'onPress'>[] = [
    {
      title: '静息心率',
      value: data.restingHeartRate,
      unit: 'bpm',
      icon: '💗',
      status: getMetricStatus(data.restingHeartRate, 'restingHeartRate'),
      description: '理想范围：40-60 bpm',
      score: acmScore.breakdown.cardiovascular
    },
    {
      title: 'BMI指数',
      value: data.bmi ? data.bmi.toFixed(1) : null,
      unit: '',
      icon: '⚖️',
      status: getMetricStatus(data.bmi, 'bmi'),
      description: '理想范围：18.5-24.9',
      score: acmScore.breakdown.metabolic
    },
    {
      title: '今日步数',
      value: data.stepCount,
      unit: '步',
      icon: '🚶‍♂️',
      status: getMetricStatus(data.stepCount, 'stepCount'),
      description: '建议目标：10,000步/天',
      score: acmScore.breakdown.activity
    },
    {
      title: '活跃能量',
      value: data.activeEnergyBurned ? Math.round(data.activeEnergyBurned) : null,
      unit: 'kcal',
      icon: '🔥',
      status: getMetricStatus(data.activeEnergyBurned, 'activeEnergy'),
      description: '今日消耗的活跃能量',
      score: acmScore.breakdown.activity
    }
  ]

  // 加载状态
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">正在获取健康数据...</Text>
      </View>
    )
  }

  // 权限错误状态
  if (!hasPermissions) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">🔒</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
          需要健康数据权限
        </Text>
        <Text className="text-gray-600 text-center leading-6">
          请在设置中允许访问您的健康数据，以便我们为您计算健康指数。
        </Text>
        <View className="mt-8 bg-blue-50 p-4 rounded-xl">
          <Text className="text-blue-800 text-sm text-center">
            💡 前往 设置 → 隐私与安全 → 健康 → {title} → 允许读取数据
          </Text>
        </View>
      </View>
    )
  }

  // 数据错误状态
  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl mb-4">⚠️</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
          数据获取失败
        </Text>
        <Text className="text-gray-600 text-center mb-4">
          {error}
        </Text>
        <TouchableOpacity
          onPress={refreshData}
          className="bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-medium">重试</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refreshData}
          tintColor="#3B82F6"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 顶部标题 */}
      <View className="bg-white pt-12 pb-6 px-4">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          健康指数
        </Text>
        <Text className="text-gray-600 text-center mt-1">
          基于您的健康数据评估
        </Text>
      </View>

      {/* 主要健康分数 */}
      <View className="bg-white pb-8">
        <HealthScoreRing score={acmScore} size={220} />
      </View>

      {/* 分项评分 */}
      <ScoreBredownCard breakdown={acmScore.breakdown} />

      {/* 健康指标网格 */}
      <View className="mt-6">
        <HealthMetricsGrid metrics={healthMetrics} />
      </View>

      {/* 个性化建议 */}
      <HealthRecommendationCard recommendations={acmScore.recommendations} />

      {/* 基础信息 */}
      {(data.age || data.biologicalSex) && (
        <View className="mx-4 mt-6 mb-8">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            👤 基础信息
          </Text>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {data.age && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-700">年龄</Text>
                <Text className="font-medium text-gray-800">{data.age} 岁</Text>
              </View>
            )}
            {data.biologicalSex && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-700">性别</Text>
                <Text className="font-medium text-gray-800">
                  {data.biologicalSex === 'male' ? '男' : data.biologicalSex === 'female' ? '女' : '其他'}
                </Text>
              </View>
            )}
            {data.height && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-700">身高</Text>
                <Text className="font-medium text-gray-800">{Math.round(data.height)} cm</Text>
              </View>
            )}
            {data.weight && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-700">体重</Text>
                <Text className="font-medium text-gray-800">{data.weight.toFixed(1)} kg</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 免责声明 */}
      <View className="mx-4 mb-8">
        <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <Text className="text-yellow-800 text-xs leading-5">
            ⚠️ 免责声明：本应用仅供参考，不能替代专业医疗建议。如有健康问题，请咨询医疗专业人士。
          </Text>
        </View>
      </View>

      {children}
    </ScrollView>
  )
}

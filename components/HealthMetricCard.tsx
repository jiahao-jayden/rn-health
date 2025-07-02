import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { MiniHealthRing } from './HealthScoreRing'
import { getScoreColor } from '../utils/acmCalculator'

export interface HealthMetricCardProps {
  title: string
  value: string | number | null
  unit?: string
  score?: number
  icon: string
  description?: string
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown'
  onPress?: () => void
}

const statusConfig = {
  excellent: {
    color: '#10B981',
    bgColor: '#D1FAE5',
    label: '优秀'
  },
  good: {
    color: '#059669',
    bgColor: '#ECFDF5',
    label: '良好'
  },
  fair: {
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    label: '一般'
  },
  poor: {
    color: '#EF4444',
    bgColor: '#FEE2E2',
    label: '需要改善'
  },
  unknown: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    label: '暂无数据'
  }
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  score,
  icon,
  description,
  status,
  onPress
}) => {
  const config = statusConfig[status]
  const displayValue = value !== null ? value : '--'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row items-start justify-between">
        {/* 左侧内容 */}
        <View className="flex-1">
          {/* 图标和标题 */}
          <View className="flex-row items-center mb-2">
            <Text className="text-2xl mr-2">{icon}</Text>
            <Text className="text-gray-700 font-medium flex-1">{title}</Text>
          </View>

          {/* 数值和单位 */}
          <View className="flex-row items-baseline mb-1">
            <Text
              className="text-2xl font-bold"
              style={{ color: config.color }}
            >
              {displayValue}
            </Text>
            {unit && value !== null && (
              <Text className="text-gray-500 ml-1 text-base">
                {unit}
              </Text>
            )}
          </View>

          {/* 状态标签 */}
          <View
            className="self-start px-2 py-1 rounded-full"
            style={{ backgroundColor: config.bgColor }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: config.color }}
            >
              {config.label}
            </Text>
          </View>

          {/* 描述文字 */}
          {description && (
            <Text className="text-xs text-gray-500 mt-2">
              {description}
            </Text>
          )}
        </View>

        {/* 右侧分数环 */}
        {score !== undefined && (
          <View className="ml-2">
            <MiniHealthRing
              score={score}
              size={50}
              color={config.color}
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

// 健康指标网格组件
export const HealthMetricsGrid: React.FC<{
  metrics: Omit<HealthMetricCardProps, 'onPress'>[]
}> = ({ metrics }) => {
  return (
    <View className="px-4">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        健康指标
      </Text>
      <View className="flex-row flex-wrap -mx-2">
        {metrics.map((metric, index) => (
          <View key={index} className="w-1/2 px-2 mb-4">
            <HealthMetricCard {...metric} />
          </View>
        ))}
      </View>
    </View>
  )
}

// 健康建议卡片
export const HealthRecommendationCard: React.FC<{
  recommendations: string[]
}> = ({ recommendations }) => {
  if (recommendations.length === 0) return null

  return (
    <View className="mx-4 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        💡 个性化建议
      </Text>
      <View className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        {recommendations.map((recommendation, index) => (
          <View key={index} className="flex-row items-start mb-3 last:mb-0">
            <View className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
            <Text className="text-blue-800 flex-1 leading-5">
              {recommendation}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// 分数详情卡片
export const ScoreBredownCard: React.FC<{
  breakdown: {
    cardiovascular: number
    metabolic: number
    activity: number
    lifestyle: number
  }
}> = ({ breakdown }) => {
  const items = [
    {
      key: 'cardiovascular',
      label: '心血管健康',
      icon: '❤️',
      score: breakdown.cardiovascular
    },
    {
      key: 'metabolic',
      label: '代谢健康',
      icon: '⚖️',
      score: breakdown.metabolic
    },
    {
      key: 'activity',
      label: '活动水平',
      icon: '🏃‍♂️',
      score: breakdown.activity
    },
    {
      key: 'lifestyle',
      label: '生活方式',
      icon: '🌱',
      score: breakdown.lifestyle
    }
  ]

  return (
    <View className="mx-4 mt-6">
      <Text className="text-lg font-semibold text-gray-800 mb-4">
        📊 分项评分
      </Text>
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        {items.map((item, index) => (
          <View key={item.key} className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl mr-3">{item.icon}</Text>
              <Text className="text-gray-700 font-medium">{item.label}</Text>
            </View>
            <View className="flex-row items-center">
              <Text
                className="text-lg font-bold mr-2"
                style={{ color: getScoreColor(item.score) }}
              >
                {item.score}
              </Text>
              <MiniHealthRing
                score={item.score}
                size={30}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

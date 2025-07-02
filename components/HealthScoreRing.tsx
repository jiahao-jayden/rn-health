import React from 'react'
import { View, Text } from 'react-native'
import { ACMScore, getScoreColor, getRiskLevelDescription } from '../utils/acmCalculator'

interface HealthScoreRingProps {
  score: ACMScore
  size?: number
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = ({
  score,
  size = 200
}) => {
  const scorePercentage = score.overall
  const scoreColor = getScoreColor(scorePercentage)
  const riskDescription = getRiskLevelDescription(score.riskLevel)

  // 计算圆环参数
  const strokeWidth = size * 0.08
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - scorePercentage / 100)

  return (
    <View className="items-center justify-center">
      {/* 圆环容器 */}
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center relative"
      >
        {/* 背景圆环 */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: '#F3F4F6',
            position: 'absolute',
          }}
        />

        {/* 进度圆环 - 使用渐变效果的模拟 */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: scoreColor,
            borderRightColor: scoreColor,
            borderBottomColor: scorePercentage > 50 ? scoreColor : 'transparent',
            borderLeftColor: scorePercentage > 75 ? scoreColor : 'transparent',
            position: 'absolute',
            transform: [{ rotate: '-90deg' }],
          }}
        />

        {/* 中心内容 */}
        <View className="items-center justify-center">
          <Text
            style={{
              fontSize: size * 0.15,
              color: scoreColor,
              fontWeight: 'bold'
            }}
          >
            {scorePercentage}
          </Text>
          <Text
            style={{
              fontSize: size * 0.08,
              color: scoreColor,
              fontWeight: '600'
            }}
          >
            分
          </Text>
          <Text
            style={{
              fontSize: size * 0.06,
              color: '#6B7280',
              textAlign: 'center',
              marginTop: 4
            }}
          >
            {riskDescription}
          </Text>
        </View>
      </View>

      {/* 分数说明 */}
      <View className="mt-4 px-4">
        <Text className="text-lg font-semibold text-center text-gray-800">
          健康指数
        </Text>
        <Text className="text-sm text-gray-600 text-center mt-1">
          {scorePercentage >= 85 && '恭喜！您的健康状况优秀'}
          {scorePercentage >= 70 && scorePercentage < 85 && '您的健康状况良好'}
          {scorePercentage >= 50 && scorePercentage < 70 && '您的健康状况需要改善'}
          {scorePercentage < 50 && '建议您关注健康状况'}
        </Text>
      </View>
    </View>
  )
}

// 简化版的小圆环组件，用于指标卡片
export const MiniHealthRing: React.FC<{
  score: number
  size?: number
  color?: string
}> = ({ score, size = 40, color }) => {
  const ringColor = color || getScoreColor(score)
  const strokeWidth = size * 0.1

  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center relative"
    >
      {/* 背景圆环 */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: '#F3F4F6',
          position: 'absolute',
        }}
      />

      {/* 进度圆环 */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'transparent',
          borderTopColor: ringColor,
          borderRightColor: score > 25 ? ringColor : 'transparent',
          borderBottomColor: score > 50 ? ringColor : 'transparent',
          borderLeftColor: score > 75 ? ringColor : 'transparent',
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      />

      {/* 分数文字 */}
      <Text
        style={{
          fontSize: size * 0.25,
          color: ringColor,
          fontWeight: 'bold'
        }}
      >
        {score}
      </Text>
    </View>
  )
}

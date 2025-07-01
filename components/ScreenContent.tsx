import { Text, View } from 'react-native'
import BrokenHealthKit, { HealthKitPermissions, type HealthValue } from "react-native-health"

import { EditScreenInfo } from './EditScreenInfo'
import { useEffect, useState } from 'react'

const NativeModules = require("react-native").NativeModules
const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit
AppleHealthKit.Constants = BrokenHealthKit.Constants

type ScreenContentProps = {
  title: string
  path: string
  children?: React.ReactNode
}

export const ScreenContent = ({ title, path, children }: ScreenContentProps) => {
  const [stepCount, setStepCount] = useState<number | null>(null)

  const permissions = {
    permissions: {
      read: [AppleHealthKit.Constants.Permissions.HeartRate, AppleHealthKit.Constants.Permissions.Steps],
      write: [AppleHealthKit.Constants.Permissions.Steps],
    },
  } as HealthKitPermissions

  useEffect(() => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      /* Called after we receive a response from the system */

      if (error) {
        console.log('[ERROR] Cannot grant permissions!')
        return
      }

      /* Can now read or write to HealthKit */

      // 获取今天的步数
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: today.toISOString(),
      }

      AppleHealthKit.getStepCount(
        options,
        (callbackError: string, results: HealthValue) => {
          if (callbackError) {
            console.log('[ERROR] Cannot get step count:', callbackError)
            return
          }

          console.log('步数数据:', results)
          setStepCount(results.value)
        },
      )
    })

  }, [])

  return (
    <View className={styles.container}>
      <Text className={styles.title}>{title}</Text>

      <View className={styles.separator} />

      {/* 显示步数 */}
      <View className={styles.stepsContainer}>
        <Text className={styles.stepsLabel}>今日步数</Text>
        <Text className={styles.stepsValue}>
          {stepCount !== null ? `${stepCount} 步` : '加载中...'}
        </Text>
      </View>

      <View className={styles.separator} />
      <EditScreenInfo path={path} />
      {children}
    </View>
  )
}

const styles = {
  container: `items-center flex-1 justify-center`,
  separator: `h-[1px] my-7 w-4/5 bg-gray-200`,
  title: `text-xl font-bold`,
  stepsContainer: `items-center mb-4`,
  stepsLabel: `text-lg text-gray-600 mb-2`,
  stepsValue: `text-3xl font-bold text-blue-600`,
}

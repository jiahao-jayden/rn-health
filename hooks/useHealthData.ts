import { useState, useEffect, useCallback } from 'react';
import { NativeModules } from 'react-native';
import BrokenHealthKit, { HealthKitPermissions, type HealthValue } from 'react-native-health';

const AppleHealthKit = NativeModules.AppleHealthKit as typeof BrokenHealthKit;
AppleHealthKit.Constants = BrokenHealthKit.Constants;

export interface HealthData {
  stepCount: number | null;
  heartRate: number | null;
  weight: number | null;
  height: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  bmi: number | null;
  restingHeartRate: number | null;
  activeEnergyBurned: number | null;
  age: number | null;
  biologicalSex: 'male' | 'female' | 'other' | null;
}

export interface HealthDataState {
  data: HealthData;
  loading: boolean;
  error: string | null;
  hasPermissions: boolean;
}

export const useHealthData = () => {
  const [state, setState] = useState<HealthDataState>({
    data: {
      stepCount: null,
      heartRate: null,
      weight: null,
      height: null,
      bloodPressureSystolic: null,
      bloodPressureDiastolic: null,
      bmi: null,
      restingHeartRate: null,
      activeEnergyBurned: null,
      age: null,
      biologicalSex: null,
    },
    loading: true,
    error: null,
    hasPermissions: false,
  });

  const permissions: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.Weight,
        AppleHealthKit.Constants.Permissions.Height,
        AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
        AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
        AppleHealthKit.Constants.Permissions.BodyMassIndex,
        AppleHealthKit.Constants.Permissions.RestingHeartRate,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.DateOfBirth,
        AppleHealthKit.Constants.Permissions.BiologicalSex,
      ],
      write: [],
    },
  };

  const getDateRange = () => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return {
      startDate: startOfDay.toISOString(),
      endDate: today.toISOString(),
    };
  };

  const fetchStepCount = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getStepCount(getDateRange(), (error: string, result: HealthValue) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.value);
        }
      });
    });
  };

  const fetchHeartRate = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getHeartRateSamples(
        getDateRange(),
        (error: string, results: HealthValue[]) => {
          if (error) {
            reject(error);
          } else if (results && results.length > 0) {
            // 获取最新的心率数据
            const latestHeartRate = results[results.length - 1];
            resolve(latestHeartRate.value);
          } else {
            resolve(0);
          }
        }
      );
    });
  };

  const fetchRestingHeartRate = async () => {
    return new Promise<number>((resolve, reject) => {
      const options = {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 过去7天
        endDate: new Date().toISOString(),
      };

      AppleHealthKit.getRestingHeartRateSamples(
        options,
        (error: string, results: HealthValue[]) => {
          if (error) {
            reject(error);
          } else if (results && results.length > 0) {
            const latestRHR = results[results.length - 1];
            resolve(latestRHR.value);
          } else {
            resolve(0);
          }
        }
      );
    });
  };

  const fetchWeight = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getLatestWeight({}, (error: string, result: HealthValue) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.value);
        }
      });
    });
  };

  const fetchHeight = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getLatestHeight({}, (error: string, result: HealthValue) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.value);
        }
      });
    });
  };

  const fetchBMI = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getLatestBmi({}, (error: string, result: HealthValue) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.value);
        }
      });
    });
  };

  const fetchActiveEnergyBurned = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getActiveEnergyBurned(
        getDateRange(),
        (error: string, results: HealthValue[]) => {
          if (error) {
            reject(error);
          } else if (results && results.length > 0) {
            // 获取最新的活跃能量消耗数据
            const latestActiveEnergy = results[results.length - 1];
            resolve(latestActiveEnergy.value);
          } else {
            resolve(0);
          }
        }
      );
    });
  };

  const fetchBiologicalSex = async () => {
    return new Promise<'male' | 'female' | 'other'>((resolve, reject) => {
      AppleHealthKit.getBiologicalSex({}, (error: string, result: any) => {
        if (error) {
          reject(error);
        } else {
          const sex = result.value.toLowerCase();
          resolve(sex === 'male' ? 'male' : sex === 'female' ? 'female' : 'other');
        }
      });
    });
  };

  const fetchAge = async () => {
    return new Promise<number>((resolve, reject) => {
      AppleHealthKit.getDateOfBirth({}, (error: string, result: any) => {
        if (error) {
          reject(error);
        } else {
          const birthDate = new Date(result.value);
          const age = Math.floor(
            (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          );
          resolve(age);
        }
      });
    });
  };

  const fetchAllHealthData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [
        stepCount,
        heartRate,
        restingHeartRate,
        weight,
        height,
        bmi,
        activeEnergyBurned,
        biologicalSex,
        age,
      ] = await Promise.allSettled([
        fetchStepCount(),
        fetchHeartRate(),
        fetchRestingHeartRate(),
        fetchWeight(),
        fetchHeight(),
        fetchBMI(),
        fetchActiveEnergyBurned(),
        fetchBiologicalSex(),
        fetchAge(),
      ]);

      setState((prev) => ({
        ...prev,
        loading: false,
        data: {
          stepCount: stepCount.status === 'fulfilled' ? stepCount.value : null,
          heartRate: heartRate.status === 'fulfilled' ? heartRate.value : null,
          restingHeartRate: restingHeartRate.status === 'fulfilled' ? restingHeartRate.value : null,
          weight: weight.status === 'fulfilled' ? weight.value : null,
          height: height.status === 'fulfilled' ? height.value : null,
          bmi: bmi.status === 'fulfilled' ? bmi.value : null,
          bloodPressureSystolic: null, // 需要单独处理血压
          bloodPressureDiastolic: null,
          activeEnergyBurned:
            activeEnergyBurned.status === 'fulfilled' ? activeEnergyBurned.value : null,
          biologicalSex: biologicalSex.status === 'fulfilled' ? biologicalSex.value : null,
          age: age.status === 'fulfilled' ? age.value : null,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '获取健康数据失败',
      }));
    }
  }, []);

  const initializeHealthKit = useCallback(() => {
    AppleHealthKit.initHealthKit(permissions, (error: string) => {
      if (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: '无法获取HealthKit权限',
          hasPermissions: false,
        }));
        return;
      }

      setState((prev) => ({ ...prev, hasPermissions: true }));
      fetchAllHealthData();
    });
  }, [fetchAllHealthData]);

  const refreshData = useCallback(() => {
    if (state.hasPermissions) {
      fetchAllHealthData();
    }
  }, [state.hasPermissions, fetchAllHealthData]);

  useEffect(() => {
    initializeHealthKit();
  }, [initializeHealthKit]);

  return {
    ...state,
    refreshData,
  };
};

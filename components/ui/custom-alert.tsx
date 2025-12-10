import React from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  // 是否只显示一个按钮（用于纯提示）
  singleButton?: boolean; 
}

export default function CustomAlert({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "确定",
  cancelText = "取消",
  singleButton = false,
}: CustomAlertProps) {
  
  return (
    <Modal
      animationType="fade" // 淡入淡出效果
      transparent={true}   // 背景透明，这样才能看到底下的半透明遮罩
      visible={visible}
      onRequestClose={onCancel} // 安卓物理返回键关闭
    >
      {/* 
         1. 外层容器：全屏半透明黑色背景 
         bg-black/50 代表 50% 透明度的黑色 (NativeWind 写法)
      */}
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          
          {/* 
             2. 弹窗卡片：白色背景，圆角，阴影 
             active:scale-100 用于阻止点击卡片时触发外层的关闭事件
          */}
          <TouchableWithoutFeedback>
            <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl items-center">
              
              {/* 标题 */}
              <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
                {title}
              </Text>
              
              {/* 内容 */}
              {message && (
                <Text className="text-base text-gray-500 text-center mb-6 leading-6">
                  {message}
                </Text>
              )}

              {/* 按钮区域 */}
              <View className="flex-row w-full space-x-4">
                
                {/* 取消按钮 (如果不是单按钮模式才显示) */}
                {!singleButton && (
                  <TouchableOpacity 
                    onPress={onCancel}
                    className="flex-1 py-3 bg-gray-100 rounded-xl items-center justify-center active:bg-gray-200"
                  >
                    <Text className="text-gray-600 font-bold text-base">{cancelText}</Text>
                  </TouchableOpacity>
                )}

                {/* 确认按钮 */}
                <TouchableOpacity 
                  onPress={onConfirm}
                  className="flex-1 py-3 bg-black rounded-xl items-center justify-center active:opacity-80"
                >
                  <Text className="text-white font-bold text-base">{confirmText}</Text>
                </TouchableOpacity>

              </View>
            </View>
          </TouchableWithoutFeedback>
          
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
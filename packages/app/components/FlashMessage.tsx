import { useEffect, useRef, useState } from "react";
import { Animated, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Variant = "success" | "error" | "info";

const VARIANT_STYLES: Record<
  Variant,
  { bg: string; border: string; text: string; icon: React.ComponentProps<typeof Ionicons>["name"]; iconColor: string }
> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    icon: "checkmark-circle",
    iconColor: "#22c55e",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-400",
    icon: "alert-circle",
    iconColor: "#ef4444",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: "information-circle",
    iconColor: "#3b82f6",
  },
};

type FlashMessageProps = {
  visible: boolean;
  message: string;
  variant?: Variant;
};

export function FlashMessage({ visible, message, variant = "success" }: FlashMessageProps) {
  const [shown, setShown] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-6)).current;
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (visible) {
      setShown(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -6, duration: 300, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setShown(false);
      });
    }
  }, [visible]);

  if (!shown) return null;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <View
        className={`flex-row items-center gap-2 ${styles.bg} border ${styles.border} rounded-xl px-4 py-2.5 mb-3`}
      >
        <Ionicons name={styles.icon} size={15} color={styles.iconColor} />
        <Text className={`${styles.text} text-sm`}>{message}</Text>
      </View>
    </Animated.View>
  );
}

import { View, Text, TouchableOpacity, Modal, Pressable, ActivityIndicator } from "react-native";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable className="flex-1 bg-black/60 justify-end" onPress={onCancel}>
        <Pressable onPress={() => {}}>
          <View className="bg-slate-900 rounded-t-2xl px-4 pt-5 pb-8">
            <Text className="text-white text-base font-semibold mb-1">{title}</Text>
            {loading ? (
              <ActivityIndicator size="small" color="#64748b" style={{ alignSelf: "flex-start", marginBottom: 20 }} />
            ) : message ? (
              <Text className="text-slate-400 text-sm mb-5">{message}</Text>
            ) : null}
            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`rounded-xl py-3.5 items-center mb-3 ${
                loading
                  ? "bg-slate-700 opacity-50"
                  : destructive
                  ? "bg-red-500/20 border border-red-500/30"
                  : "bg-blue-500"
              }`}
            >
              <Text
                className={`font-semibold text-base ${
                  destructive ? "text-red-400" : "text-white"
                }`}
              >
                {confirmLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              className="bg-slate-800 rounded-xl py-3.5 items-center"
            >
              <Text className="text-slate-300 font-medium text-base">Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

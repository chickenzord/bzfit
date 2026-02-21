import { ScrollView, View, Text } from "react-native";
import content from "../../../PRIVACY.md";

type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

function parseMarkdown(md: string): Block[] {
  const blocks: Block[] = [];
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2) });
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("- ")) {
      blocks.push({ type: "bullet", text: line.slice(2) });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  return blocks;
}

function renderInline(text: string) {
  // Render **bold** spans
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <Text key={i} style={{ fontWeight: "700" }}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    )
  );
}

export default function PrivacyScreen() {
  const blocks = parseMarkdown(content as string);

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="px-5 pt-6 pb-16">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "h1":
              return (
                <Text key={i} className="text-white text-2xl font-bold mb-1 mt-2">
                  {block.text}
                </Text>
              );
            case "h2":
              return (
                <Text key={i} className="text-white text-base font-semibold mt-6 mb-2">
                  {block.text}
                </Text>
              );
            case "bullet":
              return (
                <View key={i} className="flex-row mb-1.5 pl-1">
                  <Text className="text-slate-400 mr-2 mt-0.5">•</Text>
                  <Text className="text-slate-400 flex-1 leading-6">
                    {renderInline(block.text)}
                  </Text>
                </View>
              );
            case "paragraph":
              return (
                <Text key={i} className="text-slate-400 leading-6 mb-3">
                  {renderInline(block.text)}
                </Text>
              );
          }
        })}
      </View>
    </ScrollView>
  );
}

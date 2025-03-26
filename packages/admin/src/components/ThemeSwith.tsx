import { IconMoon, IconSun } from "@tabler/icons-react";
import {
  ActionIcon,
  Group,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";

export default function ThemeSwitch() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        variant="default"
        size="md"
        aria-label="Toggle color scheme"
      >
        {computedColorScheme === "dark" && (
          <IconSun className="w-[16px] h-[16px]" stroke={1.5} />
        )}
        {computedColorScheme === "light" && (
          <IconMoon className="w-[16px] h-[16px]" stroke={1.5} />
        )}
      </ActionIcon>
    </Group>
  );
}

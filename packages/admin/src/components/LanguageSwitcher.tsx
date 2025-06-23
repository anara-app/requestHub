import { ActionIcon, Menu, Group, Text } from "@mantine/core";
import { Languages } from "lucide-react";
import { Trans, useLingui } from "@lingui/react/macro";
import { switchLanguage, locales, type Locale } from "../common/i18n";

export default function LanguageSwitcher() {
  const { i18n } = useLingui();
  const currentLocale = i18n.locale as Locale;

  const handleLanguageChange = (locale: Locale) => {
    switchLanguage(locale);
  };

  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="md" title="Change Language">
          <Languages size={16} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Trans>Select Language</Trans>
        </Menu.Label>
        {Object.entries(locales).map(([locale, label]) => (
          <Menu.Item
            key={locale}
            onClick={() => handleLanguageChange(locale as Locale)}
            bg={currentLocale === locale ? "var(--mantine-color-blue-light)" : undefined}
          >
            <Group gap="xs">
              <Text size="sm">{label}</Text>
              {currentLocale === locale && (
                <Text size="xs" c="blue">
                  ✓
                </Text>
              )}
            </Group>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
} 
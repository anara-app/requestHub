import { useState } from 'react'
import { useLingui } from '@lingui/react'
import { Check, Languages } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { dynamicActivate, locales } from '@/lib/i18n'

export function LocaleSelector() {
  const { i18n } = useLingui()
  const [isChanging, setIsChanging] = useState(false)

  const handleLocaleChange = async (locale: string) => {
    setIsChanging(true)
    await dynamicActivate(locale)
    // Store selected locale in localStorage
    localStorage.setItem('preferred-locale', locale)
    setIsChanging(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isChanging}
          className="flex items-center gap-2"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline-block">
            {locales[i18n.locale as keyof typeof locales]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(locales).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLocaleChange(code)}
            className="flex items-center justify-between"
          >
            <span>{name}</span>
            {i18n.locale === code && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Alternative simple select version
export function LocaleSelectorSelect() {
  const { i18n } = useLingui()
  const [isChanging, setIsChanging] = useState(false)

  const handleLocaleChange = async (locale: string) => {
    setIsChanging(true)
    await dynamicActivate(locale)
    localStorage.setItem('preferred-locale', locale)
    setIsChanging(false)
  }

  return (
    <Select
      value={i18n.locale}
      onValueChange={handleLocaleChange}
      disabled={isChanging}
    >
      <SelectTrigger className="w-40">
        <SelectValue>
          {locales[i18n.locale as keyof typeof locales]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(locales).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 
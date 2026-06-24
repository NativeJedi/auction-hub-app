import { Check, ChevronDown } from 'lucide-react';

import { Button } from '@/ui-kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui-kit/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/ui-kit/ui/tooltip';

const locales = [
  { code: 'EN', active: true },
  { code: 'UA', active: false },
];

export default function LanguageSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          EN <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {locales.map((locale) =>
          locale.active ? (
            <DropdownMenuItem key={locale.code}>
              <Check />
              {locale.code}
            </DropdownMenuItem>
          ) : (
            <TooltipProvider key={locale.code}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuItem
                    aria-disabled="true"
                    className="text-muted-foreground cursor-default"
                  >
                    {locale.code}
                  </DropdownMenuItem>
                </TooltipTrigger>
                <TooltipContent>Coming soon</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  mask: string;
}

const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", dialCode: "55", mask: "(##) #####-####" },
  { code: "US", name: "Estados Unidos", dialCode: "1", mask: "(###) ###-####" },
  { code: "PT", name: "Portugal", dialCode: "351", mask: "### ### ###" },
  { code: "AR", name: "Argentina", dialCode: "54", mask: "## ####-####" },
  { code: "MX", name: "México", dialCode: "52", mask: "## #### ####" },
  { code: "ES", name: "Espanha", dialCode: "34", mask: "### ### ###" },
  { code: "CO", name: "Colômbia", dialCode: "57", mask: "### ### ####" },
  { code: "CL", name: "Chile", dialCode: "56", mask: "# #### ####" },
];

function FlagIcon({ countryCode, className }: { countryCode: string; className?: string }) {
  return (
    <img 
      src={`https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png 2x`}
      alt={countryCode}
      className={cn("w-5 h-4 object-cover rounded-sm", className)}
      loading="lazy"
    />
  );
}

const DEFAULT_COUNTRY = "BR";

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let digitIndex = 0;

  for (const char of mask) {
    if (digitIndex >= digits.length) break;
    
    if (char === "#") {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += char;
    }
  }

  return result;
}

function removeMask(value: string): string {
  return value.replace(/\D/g, "");
}

function parsePhoneValue(value: string): { countryCode: string; localNumber: string } {
  const digits = removeMask(value);
  
  for (const country of COUNTRIES) {
    if (digits.startsWith(country.dialCode)) {
      return {
        countryCode: country.code,
        localNumber: digits.slice(country.dialCode.length),
      };
    }
  }
  
  return { countryCode: DEFAULT_COUNTRY, localNumber: digits };
}

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (fullNumber: string) => void;
  defaultCountry?: string;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, defaultCountry, ...props }, ref) => {
    const parsedValue = React.useMemo(() => parsePhoneValue(value), [value]);
    
    const [selectedCountry, setSelectedCountry] = React.useState<string>(
      defaultCountry || parsedValue.countryCode || DEFAULT_COUNTRY
    );
    const [localNumber, setLocalNumber] = React.useState<string>(parsedValue.localNumber);

    const country = React.useMemo(
      () => COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0],
      [selectedCountry]
    );

    React.useEffect(() => {
      if (value) {
        const parsed = parsePhoneValue(value);
        if (parsed.localNumber !== localNumber) {
          setLocalNumber(parsed.localNumber);
        }
        if (parsed.countryCode !== selectedCountry && !defaultCountry) {
          setSelectedCountry(parsed.countryCode);
        }
      }
    }, [value]);

    const maskedValue = React.useMemo(
      () => applyMask(localNumber, country.mask),
      [localNumber, country.mask]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawDigits = removeMask(e.target.value);
      setLocalNumber(rawDigits);
      
      const fullNumber = rawDigits ? `${country.dialCode}${rawDigits}` : "";
      onChange?.(fullNumber);
    };

    const handleCountryChange = (countryCode: string) => {
      setSelectedCountry(countryCode);
      const newCountry = COUNTRIES.find((c) => c.code === countryCode);
      
      if (newCountry && localNumber) {
        const fullNumber = `${newCountry.dialCode}${localNumber}`;
        onChange?.(fullNumber);
      }
    };

    return (
      <div className="flex gap-2">
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[110px] shrink-0">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <FlagIcon countryCode={country.code} />
                <span className="text-sm font-medium">+{country.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <FlagIcon countryCode={c.code} />
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">+{c.dialCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="tel"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={maskedValue}
          onChange={handleInputChange}
          placeholder={country.mask.replace(/#/g, "9")}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput, FlagIcon, COUNTRIES, type Country };

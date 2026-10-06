"use client";

// The customer's country: every ISO 3166 country, named in the reader's language
// (Intl.DisplayNames), searchable by its name or its code. It shows "Switzerland", not "CH" (SAL-109).
import { useMemo } from "react";
import { Combobox, useOrgtik } from "@orgtik/ui";

const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " ",
  );

type Props = {
  value: string | null;
  onValueChange: (code: string | null) => void;
  placeholder?: string;
  emptyText?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
};

export default function CountryCombobox({ value, onValueChange, placeholder, emptyText, disabled, required, name }: Props) {
  const { locale } = useOrgtik();
  const options = useMemo(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      names = null;
    }
    const collator = new Intl.Collator(locale);
    return CODES.map((code) => ({ value: code, label: names?.of(code) ?? code, hint: code })).sort((a, b) => collator.compare(a.label, b.label));
  }, [locale]);

  return (
    <Combobox
      options={options}
      value={value || null}
      onValueChange={onValueChange}
      placeholder={placeholder}
      emptyText={emptyText}
      disabled={disabled}
      required={required}
      name={name}
    />
  );
}

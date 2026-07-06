import { Controller, Get, Query } from "@nestjs/common";
import { LocaleSchema } from "@kidz/contracts";
import { getStyles } from "@kidz/domain";

@Controller("v1/catalog")
export class CatalogController {
  @Get("styles")
  styles(@Query("locale") localeInput?: string) {
    const locale = LocaleSchema.catch("ru").parse(localeInput);
    return { items: getStyles(locale), total: getStyles(locale).length };
  }
}

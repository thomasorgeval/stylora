import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core'
import { provideRouter } from '@angular/router'
import { StyloraPreset } from '@stylora/ui'
import { organizationClient } from 'better-auth/client/plugins'
import { provideBetterAuth } from 'ngx-better-auth'
import { providePrimeNG } from 'primeng/config'
import { environment } from '../environments/environment'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideBetterAuth({
      baseURL: environment.apiUrl,
      plugins: [organizationClient()],
    }),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: StyloraPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
  ],
}

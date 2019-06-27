import '@ionic/core';

import { setupConfig, isPlatform } from '@ionic/core';

setupConfig({
    backButtonText: isPlatform(window, 'ios') ? 'Voltar' : ''
});

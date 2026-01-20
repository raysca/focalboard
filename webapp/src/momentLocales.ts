// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// Static imports for moment locales to replace dynamic require()
// This is needed for Vite which doesn't support dynamic require()

import 'moment/locale/ar'
import 'moment/locale/ca'
import 'moment/locale/de'
import 'moment/locale/el'
import 'moment/locale/es'
import 'moment/locale/et'
import 'moment/locale/fa'
import 'moment/locale/fr'
import 'moment/locale/he'
import 'moment/locale/hr'
import 'moment/locale/hu'
import 'moment/locale/id'
import 'moment/locale/it'
import 'moment/locale/ja'
import 'moment/locale/ka'
import 'moment/locale/ko'
import 'moment/locale/lt'
import 'moment/locale/ml'
import 'moment/locale/nb'
import 'moment/locale/nl'
import 'moment/locale/oc-lnc'
import 'moment/locale/pl'
import 'moment/locale/pt'
import 'moment/locale/pt-br'
import 'moment/locale/ru'
import 'moment/locale/sk'
import 'moment/locale/sl'
import 'moment/locale/sv'
import 'moment/locale/tr'
import 'moment/locale/uk'
import 'moment/locale/vi'
import 'moment/locale/zh-cn'
import 'moment/locale/zh-tw'

// Export a marker to confirm locales are loaded
export const momentLocalesLoaded = true

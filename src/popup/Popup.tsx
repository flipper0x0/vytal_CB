import { useState } from 'react'
import { ThemeProvider, Flex, Box } from 'theme-ui'
import { theme } from 'theme'
import { MapPin, Globe, Info } from 'react-feather'
import TabItem from './TabItem'
import LocationPage from './pages/locationPage'
import UserAgentPage from './pages/userAgentPage'
import SettingsPage from './pages/settingsPage'
import '../assets/global.css'

const Popup = () => {
  const [tab, setTab] = useState('location')

  return (
    <ThemeProvider theme={theme}>
      <Flex sx={{ height: '100%' }}>
        <Flex
          sx={{
            minWidth: '36px',
            backgroundColor: 'primary',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <TabItem Icon={<MapPin size={20} />} active={tab === 'location'} onClick={() => setTab('location')} />
          <TabItem Icon={<Globe size={20} />} active={tab === 'userAgent'} onClick={() => setTab('userAgent')} />
          <TabItem Icon={<Info size={20} />} active={tab === 'settings'} onClick={() => setTab('settings')} />
        </Flex>
        <Box sx={{ m: '16px', width: '100%' }}>
          <LocationPage tab={tab} />
          <UserAgentPage tab={tab} />
          <SettingsPage tab={tab} />
        </Box>
      </Flex>
    </ThemeProvider>
  )
}

export default Popup

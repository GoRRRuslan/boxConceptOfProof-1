import { render, screen } from '@testing-library/react-native'

import '@i18next/i18init'
import App from '@app/App'

jest.mock('@flows/spikeFlow/screens/FilamentSpikeScreen', () => {
  const { View } = jest.requireActual('react-native')

  return { FilamentSpikeScreen: () => <View testID="filamentSpikeScreen" /> }
})

describe('App', () => {
  it('renders the root screen inside the providers', async () => {
    await render(<App />)

    expect(screen.getByTestId('filamentSpikeScreen')).toBeTruthy()
  })
})

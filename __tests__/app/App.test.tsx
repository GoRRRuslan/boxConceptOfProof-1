import { render, screen } from '@testing-library/react-native'

import '@i18next/i18init'
import App from '@app/App'

describe('App', () => {
  it('renders the stage zero scaffold', async () => {
    await render(<App />)

    expect(screen.getByTestId('appRoot')).toBeTruthy()
    expect(screen.getByText('Mystery Watch')).toBeTruthy()
  })
})

import { fireEvent, render, screen } from '@testing-library/react-native'

import type { ICatalogueCard } from '@flows/catalogueFlow/_types'
import { BoxCard } from '@flows/catalogueFlow/screens/CatalogueScreen/_components/BoxCard'
import { EBoxIdentifier } from '@networking/api/MysteryBoxApi/_types'

const card: ICatalogueCard = {
  identifier: EBoxIdentifier.Starter,
  name: 'Starter Box',
  priceText: '$50',
  prizeText: 'Win a watch worth up to $1,200',
  affordabilityText: null,
  isAffordable: true,
  colorLinearRgba: [0, 0, 1, 1],
}

describe('BoxCard', () => {
  it('shows the name, the price and the best prize', async () => {
    await render(<BoxCard card={card} onPress={jest.fn()} />)

    expect(screen.getByText('Starter Box')).toBeTruthy()

    expect(screen.getByText('$50')).toBeTruthy()

    expect(screen.getByText('Win a watch worth up to $1,200')).toBeTruthy()

    expect(screen.queryByTestId('boxAffordability-starter')).toBeNull()
  })

  it('tells which box was pressed', async () => {
    const onPress = jest.fn()

    await render(<BoxCard card={card} onPress={onPress} />)

    await fireEvent.press(screen.getByTestId('boxCard-starter'))

    expect(onPress).toHaveBeenCalledWith(EBoxIdentifier.Starter)
  })

  it('says so when the balance is too low', async () => {
    await render(
      <BoxCard card={{ ...card, isAffordable: false, affordabilityText: 'Not enough balance' }} onPress={jest.fn()} />,
    )

    expect(screen.getByTestId('boxAffordability-starter')).toBeTruthy()
  })
})

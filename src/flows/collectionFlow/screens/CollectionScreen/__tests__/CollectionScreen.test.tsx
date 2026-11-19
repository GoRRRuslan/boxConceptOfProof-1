import { fireEvent, render, screen } from '@testing-library/react-native'

import { useCollectionFacade } from '@flows/collectionFlow/_facades/useCollectionFacade'
import type { ICollectionFacade } from '@flows/collectionFlow/_types'
import { CollectionScreen } from '@flows/collectionFlow/screens/CollectionScreen'

jest.mock('@flows/collectionFlow/_facades/useCollectionFacade')

const baseFacade: ICollectionFacade = {
  titleText: 'My Collection',
  totalValueLabelText: 'Total value',
  totalValueText: '$0',
  countText: '0 watches',
  items: [],
  isEmpty: true,
  emptyTitleText: 'No watches yet',
  emptyDescriptionText: 'Buy a mystery box',
  browseLabelText: 'Browse boxes',
  handleBrowsePress: jest.fn(),
}

const mockFacade = (facade: ICollectionFacade) => {
  jest.mocked(useCollectionFacade).mockReturnValue(facade)
}

describe('CollectionScreen', () => {
  it('shows the empty state with a way to the boxes', async () => {
    mockFacade(baseFacade)

    await render(<CollectionScreen />)

    expect(screen.getByTestId('collectionEmpty')).toBeTruthy()

    expect(screen.queryByTestId('collectionList')).toBeNull()

    await fireEvent.press(screen.getByTestId('browseBoxesButton'))

    expect(baseFacade.handleBrowsePress).toHaveBeenCalledTimes(1)
  })

  it('lists the watches with the count and the total value', async () => {
    mockFacade({
      ...baseFacade,
      isEmpty: false,
      countText: '2 watches',
      totalValueText: '$160',
      items: [
        { ownershipIdentifier: 'purchase-2', nameText: 'GMT Master', brandText: 'Rolex', valueText: '$1,200', boxText: 'From Classic Box', thumbnailSource: 1 },
        { ownershipIdentifier: 'purchase-1', nameText: 'Casio Vintage', brandText: 'Casio', valueText: '$80', boxText: null, thumbnailSource: 2 },
      ],
    })

    await render(<CollectionScreen />)

    expect(screen.queryByTestId('collectionEmpty')).toBeNull()

    expect(screen.getByTestId('collectionHeaderValue').props.children).toBe('$160')

    expect(screen.getByTestId('collectionItem-purchase-2')).toBeTruthy()

    expect(screen.getByText('GMT Master')).toBeTruthy()

    expect(screen.getByText('From Classic Box')).toBeTruthy()
  })
})

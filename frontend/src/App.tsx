import { useState } from 'react'
import type { InvType } from './api/types'
import Sidebar from './Sidebar.tsx'
import ProductComparison from './ProductComparison'
import './App.css'

function App() {
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<InvType | null>(null)

  return (
    <div className="app-shell">
      <Sidebar
        search={search}
        selectedTypeId={selectedType?.typeId ?? null}
        onSearchChange={setSearch}
        onSelectType={setSelectedType}
      />

      <main id="center">
        <h1>{selectedType ? selectedType.typeName : 'Orders'}</h1>

        {selectedType ? (
          <p className="selected-type-meta">
            Type {selectedType.typeId}
            {selectedType.basePrice != null
              ? ` · base £${selectedType.basePrice}`
              : ''}
          </p>
        ) : null}

        {selectedType ? (
          <ProductComparison
            key={selectedType.typeId}
            typeId={selectedType.typeId}
          />
        ) : (
          <p>Select a product from the sidebar to compare offers.</p>
        )}
      </main>
    </div>
  )
}

export default App
import { useEffect, useRef, useState } from "react";
import type { ArtWorkData } from "../types/artworkInterface";
import { fetchData } from "../services/api";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { InputText } from 'primereact/inputtext';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from "primereact/button";

function HomePage() {

    const [someData, setSomeData] = useState<ArtWorkData[]>([]);
    const [selectedRows, setSelectedRows] = useState<ArtWorkData[]>([]);
    const [selectedIdList, setSelectedIdList] = useState<Set<number>>(new Set());
    const [firstIndex, setFirstIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [numInput, setNumInput] = useState<string>("");
    const [msg, setMsg] = useState<string>("");

    const opRef = useRef<OverlayPanel>(null);

    useEffect(() => {
        const getDataFromApi = async () => {
            try {
                const currentPg = Math.floor(firstIndex / pageSize) + 1;

                const res = await fetchData(currentPg, pageSize);
                setSomeData(res.data);
                setTotalCount(res.pagination.total);
            } catch (err) {
                console.error("Failed to load data from api:", err);
            }
        };

        getDataFromApi();
    }, [firstIndex, pageSize, selectedIdList]);

    return (
        <div>
            <h1>ArtWork Data</h1>
            {msg && (
                <div style={{ 
                    padding: '10px', 
                    margin: '10px 0', 
                    borderRadius: '4px',
                    backgroundColor: msg.includes('Error') ? '#ffebee' : '#e8f5e8',
                    color: msg.includes('Error') ? '#c62828' : '#2e7d32',
                    border: `1px solid ${msg.includes('Error') ? '#ffcdd2' : '#c8e6c9'}` 
                }}>
                    {msg}
                </div>
            )}

            <DataTable value={someData}
                selectionMode="checkbox"
                selection={someData.filter(item => selectedIdList.has(item.id))}
                onSelectionChange={(e: { value: ArtWorkData[] }) => {
                    const newIds = new Set(selectedIdList);

                    e.value.forEach(val => newIds.add(val.id));

                    someData.forEach(row => {
                        const exists = e.value.find(s => s.id === row.id);
                        if (!exists) {
                            newIds.delete(row.id);
                        }
                    });

                    setSelectedIdList(newIds);

                    const finalRows = Array.from(newIds).map(id => {
                        const foundInCurrent = someData.find(obj => obj.id === id);
                        const prevOne = selectedRows.find(obj => obj.id === id);
                        return foundInCurrent || prevOne;
                    }).filter(Boolean) as ArtWorkData[];

                    setSelectedRows(finalRows);
                }}
                dataKey="id"
                key={`table-${firstIndex}-${pageSize}`}
                tableStyle={{ minWidth: '50rem' }}>

                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                <Column field="title" header={
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button
                            type="button"
                            icon="pi pi-angle-down"
                            size="small"
                            text
                            style={{ 
                                color: 'black', 
                                border: 'none', 
                                outline: 'none',
                                boxShadow: 'none',
                                padding: '2px',
                                background: 'transparent'
                            }}
                            onClick={(e) => {
                                opRef.current?.toggle(e);
                            }}
                        />
                        <span>Title</span>
                    </div>
                } />

                <Column field="place_of_origin" header="Place of Origin" />
                <Column field="artist_display" header="Artist Display" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Start Year" />
                <Column field="date_end" header="End Year" />
            </DataTable>

            <OverlayPanel ref={opRef}>
                <div style={{ padding: '1rem', minWidth: '200px' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="titleInput" style={{ display: 'block', marginBottom: '0.5rem' }}>
                            Enter new title:
                        </label>
                        <InputText
                            id="titleInput"
                            value={numInput}
                            onChange={(e) => setNumInput(e.target.value)}
                            keyfilter="int"
                            placeholder="Enter number of items to select"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <Button
                        label="Submit"
                        style={{ 
                            color: 'white', 
                            border: '1px solid black', 
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            padding: '8px 16px',
                            background: '#007bff',   
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            const totalToPick = parseInt(numInput);

                            if (totalToPick > totalCount) {
                                setMsg(`Error: Cannot select ${totalToPick} items. Only ${totalCount} items available.`);
                                return;
                            }

                            const startFrom = 0;
                            const to = totalToPick - 1;

                            const pageStart = Math.floor(startFrom / pageSize) + 1;
                            const pageEnd = Math.floor(to / pageSize) + 1;

                            const idStore = new Set<number>();

                            const collectItems = async () => {
                                for (let i = pageStart; i <= pageEnd; i++) {
                                    const result = await fetchData(i, pageSize);
                                    const rows = result.data;
                                    const pageStartIndex = (i - 1) * pageSize;

                                    rows.forEach((x, idx) => {
                                        const globalIdx = pageStartIndex + idx;
                                        if (globalIdx >= startFrom && globalIdx <= to) {
                                            idStore.add(x.id);
                                        }
                                    });
                                }

                                setSelectedIdList(idStore);
                                setSelectedRows([]);
                                
                                const howManyPages = pageEnd - pageStart + 1;
                                setMsg(`${totalToPick} items selected across ${howManyPages} pages. Navigate to see selections.`);
                                opRef.current?.hide();
                                setNumInput('');

                                const currentPage = Math.floor(firstIndex / pageSize) + 1;
                                const newData = await fetchData(currentPage, pageSize);
                                setSomeData(newData.data);
                            };

                            collectItems();
                        }}
                        disabled={!numInput.trim()}
                    />
                </div>
            </OverlayPanel>



            <Paginator
                first={firstIndex}
                rows={pageSize}
                totalRecords={totalCount}
                rowsPerPageOptions={[10, 20, 30]}
                onPageChange={(e) => {
                    setFirstIndex(e.first);
                    setPageSize(e.rows);
                }}
            />
        </div>
    )
}

export default HomePage;

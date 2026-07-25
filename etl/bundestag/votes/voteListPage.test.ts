import assert from 'node:assert/strict'
import test from 'node:test'
import { hasNextVoteListPage, parseVoteListPage } from './voteListPage.ts'

test('parses the current Bundestag vote download markup', () => {
  const page = parseVoteListPage(`
    <template data-js-document-results="table">
      <tr class="e-table__row m-documents__tableRow" data-js-first-addition>
        <td class="e-table__data m-documents__tableData">10. Juli 2026</td>
        <td class="e-table__data m-documents__tableData"></td>
        <td class="e-table__data m-documents__tableData">
          <div class="e-linkListItem">
            <a href="https://www.bundestag.de/resource/blob/1194614/20260710_8.pdf">
              <span>10.07.2026: <span>Sportfördergesetz der Bundesregierung</span></span>
            </a>
            <a href="https://www.bundestag.de/resource/blob/1194616/20260710_8-xls.xlsx">
              XLSX-Version zum Herunterladen
            </a>
          </div>
        </td>
      </tr>
      <tr class="e-table__row m-documents__tableRow">
        <td class="e-table__data m-documents__tableData">5. Juli 2024</td>
        <td class="e-table__data m-documents__tableData"></td>
        <td class="e-table__data m-documents__tableData">
          <div class="e-linkListItem">
            <a href="https://www.bundestag.de/resource/blob/1012104/20240705_1.pdf">
              <span>Änderung des Schwangerschaftskonfliktgesetzes</span>
            </a>
            <a href="https://www.bundestag.de/resource/blob/1012112/20240705_1_xls.xlsx">
              XLSX-Version zum Herunterladen
            </a>
          </div>
        </td>
      </tr>
    </template>
  `)

  assert.deepEqual(page, {
    downloads: [
      {
        label: '10.07.2026: Sportfördergesetz der Bundesregierung',
        publicationDate: '10. Juli 2026',
        pdfUrl: 'https://www.bundestag.de/resource/blob/1194614/20260710_8.pdf',
        xlsxUrl: 'https://www.bundestag.de/resource/blob/1194616/20260710_8-xls.xlsx',
        sourceId: null,
      },
      {
        label: 'Änderung des Schwangerschaftskonfliktgesetzes',
        publicationDate: '5. Juli 2024',
        pdfUrl: 'https://www.bundestag.de/resource/blob/1012104/20240705_1.pdf',
        xlsxUrl: 'https://www.bundestag.de/resource/blob/1012112/20240705_1_xls.xlsx',
        sourceId: null,
      },
    ],
    hits: null,
    resultCount: 2,
  })
})

test('paginates full pages when the upstream hit count is absent', () => {
  const page = { downloads: [], hits: null, resultCount: 30 }
  assert.equal(hasNextVoteListPage(page, 0, 30), true)
  assert.equal(hasNextVoteListPage({ ...page, resultCount: 29 }, 30, 30), false)
  assert.equal(hasNextVoteListPage({ ...page, hits: 61 }, 30, 30), true)
  assert.equal(hasNextVoteListPage({ ...page, hits: 60 }, 30, 30), false)
})

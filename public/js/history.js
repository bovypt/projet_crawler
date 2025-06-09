const table = document.getElementById('history-table').getElementsByTagName('tbody')[0];
const searchInput = document.getElementById('search');

function formatDate(date) {
    return new Date(date).toLocaleString();
}

function createTableRow(page) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><a href="${page.url}" target="_blank">${page.url}</a></td>
        <td>${page.title || '-'}</td>
        <td>${page.description || '-'}</td>
        <td>${formatDate(page.crawledAt)}</td>
        <td>
            ${page.zipFile ? `<a href="/download/${page.zipFile}">Télécharger</a>` : '-'}
        </td>
    `;
    return row;
}

function filterTable(searchTerm) {
    const rows = table.getElementsByTagName('tr');
    searchTerm = searchTerm.toLowerCase();
    
    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    }
}

async function loadHistory() {
    try {
        const response = await fetch('/pages');
        const pages = await response.json();
        
        table.innerHTML = '';
        if (!pages.length) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5" style="text-align: center;">Aucune page crawlee pour le moment.</td>';
            table.appendChild(row);
            return;
        }
        
        pages.forEach(page => {
            table.appendChild(createTableRow(page));
        });
    } catch (error) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center;">Erreur lors du chargement de l\'historique</td>';
        table.appendChild(row);
    }
}

searchInput.addEventListener('input', (e) => {
    filterTable(e.target.value);
});

loadHistory(); 
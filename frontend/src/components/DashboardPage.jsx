// frontend/src/components/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { auth, callScrapeData, callGetScrapedBooks } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

// Import React-Bootstrap components
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Table from 'react-bootstrap/Table';
import Pagination from 'react-bootstrap/Pagination';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form'; // Added for input fields
import Row from 'react-bootstrap/Row';   // Added for layout
import Col from 'react-bootstrap/Col';     // Added for layout

const ADMIN_EMAIL = "admin@gmail.com"; // Define admin email

// --- PREDEFINED SITE CONFIGURATIONS ---
const PREDEFINED_SITES = [
    {
        name: "BooksToScrape.com (Default)",
        url: "http://books.toscrape.com/",
        selectors: {
            article: "article.product_pod",
            title: "h3 > a",
            link: "h3 > a",
            price: "div.product_price > p.price_color",
        },
    },
    // Add more site configurations here if needed
    // {
    //     name: "Another Example Site",
    //     url: "https://anothersite.com/products",
    //     selectors: { /* ... its selectors ... */ },
    // },
];
const CUSTOM_SITE_CONFIG_NAME = "Custom Configuration";
// --- END PREDEFINED SITES ---


function DashboardPage({ currentUser }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isAdmin = currentUser && currentUser.email === ADMIN_EMAIL;

  // --- State for scraping configuration ---
  const [selectedConfigName, setSelectedConfigName] = useState(PREDEFINED_SITES[0].name);
  const [customUrl, setCustomUrl] = useState(PREDEFINED_SITES[0].url);
  const [customArticleSelector, setCustomArticleSelector] = useState(PREDEFINED_SITES[0].selectors.article);
  const [customTitleSelector, setCustomTitleSelector] = useState(PREDEFINED_SITES[0].selectors.title);
  const [customLinkSelector, setCustomLinkSelector] = useState(PREDEFINED_SITES[0].selectors.link);
  const [customPriceSelector, setCustomPriceSelector] = useState(PREDEFINED_SITES[0].selectors.price || '');
  const isCustomConfig = selectedConfigName === CUSTOM_SITE_CONFIG_NAME;
  // --- End scraping configuration state ---

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    console.log("fetchData - Current Firebase user (from prop):", currentUser?.email);

    if (!currentUser) {
      setError("User not authenticated. Please log in again.");
      setLoading(false);
      setData([]);
      return;
    }

    try {
      console.log("Attempting to call 'getScrapedBooks' function...");
      const result = await callGetScrapedBooks();
      console.log("Result from 'getScrapedBooks':", result);

      if (result.data.success) {
        setData(result.data.data || []);
      } else {
        setError(result.data.message || 'Failed to fetch data.');
        setData([]);
      }
    } catch (err) {
      console.error("Full error object from calling 'getScrapedBooks':", err);
      setData([]);
      setError(err.message || `Failed to fetch data. Code: ${err.code || 'N/A'}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    } else {
      setData([]);
    }
  }, [currentUser, fetchData]);

  const handleScrapeNow = async () => {
    console.log("handleScrapeNow - Current Firebase user (from prop):", currentUser?.email);

    if (!isAdmin) {
      setError("You are not authorized to perform this action.");
      return;
    }
    if (!currentUser) {
        setError("User not authenticated. Please log in again.");
        return;
    }

    let urlToScrape;
    let selectorsToUse;

    if (isCustomConfig) {
        if (!customUrl.trim() || !customArticleSelector.trim() || !customTitleSelector.trim() || !customLinkSelector.trim()) {
            setError("For custom configuration, please provide URL and all required CSS selectors (Article, Title, Link). Price selector is optional.");
            return;
        }
        urlToScrape = customUrl;
        selectorsToUse = {
            article: customArticleSelector,
            title: customTitleSelector,
            link: customLinkSelector,
            price: customPriceSelector.trim() || null,
        };
    } else {
        const selectedConfig = PREDEFINED_SITES.find(site => site.name === selectedConfigName);
        if (!selectedConfig) {
            setError("Invalid site configuration selected.");
            return;
        }
        urlToScrape = selectedConfig.url;
        selectorsToUse = selectedConfig.selectors;
    }

    setScraping(true);
    setError('');
    setMessage('');
    try {
      console.log(`Attempting to call 'scrapeData' for URL: ${urlToScrape}`);
      const payload = {
          url: urlToScrape,
          selectors: selectorsToUse,
      };
      const result = await callScrapeData(payload);
      console.log("Result from 'scrapeData':", result);

      if (result.data.success) {
        setMessage(result.data.message);
        fetchData(); // Refresh data after scraping
      } else {
        setError(result.data.message || 'Scraping failed.');
      }
    } catch (err) {
      console.error("Full error object from calling 'scrapeData':", err);
      if (err.code === 'permission-denied') {
        setError("Permission denied. You are not authorized to scrape data.");
      } else {
        setError(err.message || `An error occurred during scraping. Code: ${err.code || 'N/A'}`);
      }
    } finally {
      setScraping(false);
    }
  };

  const handleLogout = async () => {
    console.log("Attempting to log out...");
    try {
      await signOut(auth);
      console.log("User signed out successfully.");
      setData([]);
      setMessage('');
      setError('');
    } catch (error) {
      console.error("Logout failed:", error);
      setError("Logout failed. Please try again.");
    }
  };

  const formatScrapedAt = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    if (typeof timestamp._seconds === 'number' && typeof timestamp._nanoseconds === 'number') {
      return new Date(timestamp._seconds * 1000 + timestamp._nanoseconds / 1000000).toLocaleString();
    }
    return 'Invalid Date';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'ascending' });

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...currentItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] === undefined || a[sortConfig.key] === null ? '' : a[sortConfig.key];
        const valB = b[sortConfig.key] === undefined || b[sortConfig.key] === null ? '' : b[sortConfig.key];
        if (sortConfig.key === 'scrapedAt') {
            const dateA = (valA && valA._seconds) ? new Date(valA._seconds * 1000) : ( (valA && typeof valA.toDate === 'function') ? valA.toDate() : new Date(0) );
            const dateB = (valB && valB._seconds) ? new Date(valB._seconds * 1000) : ( (valB && typeof valB.toDate === 'function') ? valB.toDate() : new Date(0) );
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
            const comparison = valA.localeCompare(valB);
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        } else {
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [currentItems, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Function to handle changes in the selected configuration dropdown
  const handleConfigChange = (e) => {
    const newConfigName = e.target.value;
    setSelectedConfigName(newConfigName);
    if (newConfigName !== CUSTOM_SITE_CONFIG_NAME) {
        const newConfig = PREDEFINED_SITES.find(site => site.name === newConfigName);
        if (newConfig) {
            setCustomUrl(newConfig.url);
            setCustomArticleSelector(newConfig.selectors.article);
            setCustomTitleSelector(newConfig.selectors.title);
            setCustomLinkSelector(newConfig.selectors.link);
            setCustomPriceSelector(newConfig.selectors.price || '');
        }
    } else {
        // Optionally clear custom fields or set to some defaults when switching to Custom
        setCustomUrl(''); 
        setCustomArticleSelector('');
        setCustomTitleSelector('');
        setCustomLinkSelector('');
        setCustomPriceSelector('');
    }
  };

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0 fw-bold fs-3"> {/* Using Bootstrap font size and weight classes */}
          {isAdmin ? "Admin Dashboard" : "Scraped Data Viewer"}
        </h1>
        <div>
          {currentUser && (
            <span className="me-3 align-middle">
              {currentUser.email} {isAdmin && <Badge bg="info">Admin</Badge>}
            </span>
          )}
          <Button variant="danger" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 p-3 border rounded"> {/* Grouping admin controls */}
          <Form.Group className="mb-3" controlId="siteConfigSelect">
            <Form.Label>Scraping Configuration:</Form.Label>
            <Form.Select value={selectedConfigName} onChange={handleConfigChange}>
              {PREDEFINED_SITES.map(site => (
                <option key={site.name} value={site.name}>{site.name}</option>
              ))}
              <option value={CUSTOM_SITE_CONFIG_NAME}>{CUSTOM_SITE_CONFIG_NAME}</option>
            </Form.Select>
          </Form.Group>

          {isCustomConfig && (
            <div className="custom-config-inputs border p-3 mb-3 bg-light">
              <h5 className="mb-3">Custom Configuration Details</h5>
              <Form.Group className="mb-3" controlId="customUrlInput">
                <Form.Label>URL to Scrape:</Form.Label>
                <Form.Control 
                  type="url" 
                  placeholder="Enter website URL"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)} 
                />
              </Form.Group>
              <Row className="mb-1">
                <Form.Group as={Col} md="6" controlId="customArticleSelectorInput" className="mb-2">
                  <Form.Label>Article/Item Selector:</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., .item-class or article.main"
                    value={customArticleSelector}
                    onChange={(e) => setCustomArticleSelector(e.target.value)} 
                  />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="customTitleSelectorInput" className="mb-2">
                  <Form.Label>Title Selector (within item):</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., h2.title or .item-name"
                    value={customTitleSelector}
                    onChange={(e) => setCustomTitleSelector(e.target.value)} 
                  />
                </Form.Group>
              </Row>
              <Row>
                <Form.Group as={Col} md="6" controlId="customLinkSelectorInput" className="mb-2">
                  <Form.Label>Link Selector (for URL, within item):</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., a.read-more (for href)"
                    value={customLinkSelector}
                    onChange={(e) => setCustomLinkSelector(e.target.value)} 
                  />
                </Form.Group>
                <Form.Group as={Col} md="6" controlId="customPriceSelectorInput" className="mb-2">
                  <Form.Label>Price Selector (within item, optional):</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="e.g., .price or span.amount"
                    value={customPriceSelector}
                    onChange={(e) => setCustomPriceSelector(e.target.value)} 
                  />
                </Form.Group>
              </Row>
            </div>
          )}

          <Button
            variant="success"
            className="mb-3 w-100" // Make button full width within its container
            onClick={handleScrapeNow}
            disabled={scraping || loading || (isCustomConfig && !customUrl.trim())}
          >
            {scraping ? 'Scraping...' : 'Scrape Now'}
          </Button>

          <Alert variant="info">
            <Alert.Heading as="h5">Admin Controls Active</Alert.Heading>
            <p className="mb-0">You have administrative privileges to scrape new data.</p>
          </Alert>
        </div>
      )}

      {message && <Alert variant="success" className="mt-3">{message}</Alert>}
      {error && <Alert variant="danger" className="mt-3">Error: {error}</Alert>}

      {loading && <p className="mt-3">Loading data...</p>}

      {!loading && data.length === 0 && (
        <Alert variant="warning" className="mt-3">
          No data available.
          {isAdmin
            ? " Select a configuration and try scraping, or check for errors."
            : " Please check back later or contact an admin if you expect to see data."
          }
        </Alert>
      )}

      {!loading && data.length > 0 && (
        <>
          <Table striped bordered hover responsive size="sm" className="mt-3 caption-top">
            <caption>List of Scraped Items</caption>
            <thead>
              <tr>
                <th onClick={() => requestSort('title')} style={{ cursor: 'pointer' }}>
                  Title {sortConfig.key === 'title' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
                <th>URL</th>
                <th onClick={() => requestSort('scrapedAt')} style={{ cursor: 'pointer' }}>
                  Scraped At {sortConfig.key === 'scrapedAt' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  </td>
                  <td>
                    {formatScrapedAt(item.scrapedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-3">
              <Pagination>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
                    {number}
                  </Pagination.Item>
                ))}
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}
export default DashboardPage;
import { useEffect, useState } from 'react';
import Head from 'next/head';

interface Content {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface ApiResponse {
  contents: Content[];
  total: number;
  page: number;
  totalPages: number;
}

export default function Documents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const fetchDocuments = async (pageNum = 1, searchTerm = '', statusFilter = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/content?page=${pageNum}&limit=10&search=${searchTerm}&status=${statusFilter}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: ApiResponse = await response.json();
      
      setContents(data.contents);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSearch = () => {
    fetchDocuments(1, search, status);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    fetchDocuments(1, search, e.target.value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <>
      <Head>
        <title>Raw Documents List</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </Head>

      <div className="container mt-4">
        <h1 className="mb-4">Raw Documents</h1>
        
        {/* Search and Filter Section */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button className="btn btn-outline-secondary" type="button" onClick={handleSearch}>
                <i className="bi bi-search"></i> Search
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <select className="form-select" value={status} onChange={handleStatusChange}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading documents...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger text-center">
            {error}
          </div>
        )}

        {/* Documents List */}
        <div className="row">
          {contents.map((content) => (
            <div key={content._id} className="col-md-6 col-lg-4 mb-4">
              <div className="card document-card">
                <div className="card-body position-relative">
                  <span className={`badge bg-${getStatusColor(content.status)} position-absolute top-0 end-0 m-2`}>
                    {content.status}
                  </span>
                  <h5 className="card-title">{content.title || 'Untitled Document'}</h5>
                  <p className="card-text">
                    <small className="text-muted">
                      Created: {new Date(content.createdAt).toLocaleDateString()}
                    </small>
                  </p>
                  <a href={`/api/content/${content._id}`} className="btn btn-primary btn-sm">View Details</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Page navigation" className="mt-4">
            <ul className="pagination justify-content-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => fetchDocuments(pageNum, search, status)}
                  >
                    {pageNum}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js" />
    </>
  );
} 
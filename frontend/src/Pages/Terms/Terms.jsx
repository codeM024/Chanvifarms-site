import './Terms.css'

const Terms = () => {
  return (
    <div className="terms-container">
      <div className="terms-header">
        <h1>Terms & Conditions</h1>
      </div>
      
      <div className="terms-content">
        <section>
          <h2>1. Introduction</h2>
          <p>Welcome to Chanvi Farms. By accessing and using our website and services, you agree to be bound by these Terms and Conditions.</p>
        </section>

        <section>
          <h2>2. Ordering & Delivery</h2>
          <ul>
            <li>Orders must be placed at least one day in advance</li>
            <li>Delivery times are subject to availability and location</li>
            <li>Minimum order value may apply for free delivery</li>
            <li>Delivery charges may vary based on location and order value</li>
          </ul>
        </section>

        <section>
          <h2>3. Product Quality</h2>
          <ul>
            <li>We guarantee fresh, high-quality produce</li>
            <li>Products are carefully inspected before delivery</li>
            <li>Any quality issues must be reported within 24 hours of delivery</li>
          </ul>
        </section>

        <section>
          <h2>4. Payment Terms</h2>
          <ul>
            <li>We accept various payment methods including online payment and COD</li>
            <li>All prices are inclusive of applicable taxes</li>
            <li>Prices are subject to change without prior notice</li>
          </ul>
        </section>

        <section>
          <h2>5. Cancellation & Refunds</h2>
          <ul>
            <li>Orders can be cancelled up to 12 hours before delivery</li>
            <li>Refunds will be processed within 5-7 business days</li>
            <li>Refund amount may vary based on payment method and bank policies</li>
          </ul>
        </section>

        <section>
          <h2>6. Account Management</h2>
          <ul>
            <li>Users are responsible for maintaining account confidentiality</li>
            <li>We reserve the right to terminate accounts for policy violations</li>
            <li>Users must provide accurate and current information</li>
          </ul>
        </section>

        <section>
          <h2>7. Modifications</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of our services after changes constitutes acceptance of the modified terms.</p>
        </section>

        <div className="terms-footer">
          <p>Last updated: May 2025</p>
          <p>For any questions regarding these terms, please contact us at support@chanvifarms.com</p>
        </div>
      </div>
    </div>
  )
}

export default Terms
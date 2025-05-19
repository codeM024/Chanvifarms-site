import './Privacy.css'

const Privacy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-header">
        <h1>Privacy Policy</h1>
      </div>
      
      <div className="privacy-content">
        <section>
          <h2>1. Information We Collect</h2>
          <p>At Chanvi Farms, we collect information that helps us provide and improve our services:</p>
          <ul>
            <li>Personal information (name, email, phone number, address)</li>
            <li>Order history and preferences</li>
            <li>Device information and location data (with consent)</li>
            <li>Payment information (processed securely through our payment partners)</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <ul>
            <li>Process and deliver your orders</li>
            <li>Send order updates and delivery notifications</li>
            <li>Improve our products and services</li>
            <li>Communicate about promotions and updates</li>
            <li>Prevent fraud and enhance security</li>
          </ul>
        </section>

        <section>
          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share your information with:</p>
          <ul>
            <li>Delivery partners to fulfill orders</li>
            <li>Payment processors for transactions</li>
            <li>Service providers who assist our operations</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <ul>
            <li>We implement industry-standard security measures</li>
            <li>Regular security assessments and updates</li>
            <li>Secure payment processing through trusted partners</li>
            <li>Limited access to personal information by authorized personnel</li>
          </ul>
        </section>

        <section>
          <h2>5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of marketing communications</li>
            <li>Export your data in a portable format</li>
          </ul>
        </section>

        <section>
          <h2>6. Cookies and Tracking</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul>
            <li>Remember your preferences</li>
            <li>Analyze site usage</li>
            <li>Enhance site functionality</li>
            <li>Provide personalized experiences</li>
          </ul>
        </section>

        <section>
          <h2>7. Updates to Privacy Policy</h2>
          <p>We may update this policy periodically. We will notify you of significant changes through our website or email.</p>
        </section>

        <div className="privacy-footer">
          <p>Last updated: May 2025</p>
          <p>For privacy concerns, please contact us at privacy@chanvifarms.com</p>
        </div>
      </div>
    </div>
  )
}

export default Privacy
import './ExploreMenu.css'
import ImageLoader from './ImageLoader'
import exoticveggi from '../../assets/exoticveggicard.jpg'
import veggicard from '../../assets/veggicard.jpg'
import mixfruits from '../../assets/mixfru.jpg'
import emixfruits from '../../assets/mix-fruits.jpg'
import rawmeat from '../../assets/rawmeat.jpg'
import groceries from '../../assets/grocriess.jpeg'

const ExploreMenu = () => {
  const categories = [
    {
      title: "Organic Vegetables",
      description: "From farm-fresh leafy greens to crisp root Organic vegetables, discover our premium quality local produce.",
      image: veggicard
    },
    {
      title: "Organic Fruits",
      description: "Experience the sweetness of nature with our handpicked seasonal Organicfruits.",
      image: mixfruits
    },
    {
      title: "Exotic Organic Vegetables",
      description: "Discover rare and unique Organic vegetables from around the world for your culinary adventures.",
      image: exoticveggi
    },
    {
      title: "Exotic Organic Fruits",
      description: "Explore our collection of exotic Organic fruits from across the globe.",
      image: emixfruits
    },
    {
      title: "Organic Groceries",
      description: "Essential Organic grocery items and pantry staples for your everyday needs.",
      image: groceries
    }
  ]

  return (
    <div className="explore-menu" id="explore-menu">
      <div className="explore-menu-header">
        <h1>Categories</h1>
        <p>See What We <strong>Provide</strong></p>
      </div>

      <div className="categories-grid">
        {categories.map((item, index) => (
          <div key={index} className="category-card">
            <div className="category-image">
              <ImageLoader
                src={item.image}
                alt={item.title}
                className="category-image-content"
              />
            </div>
            <div className="category-content">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExploreMenu
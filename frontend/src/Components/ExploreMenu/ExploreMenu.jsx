import './ExploreMenu.css'
import ImageLoader from './ImageLoader'
import exoticveggi from '../../assets/exoticveggicard.jpg'
import veggicard from '../../assets/veggicard.jpg'
import mixfruits from '../../assets/mixfru.jpg'
import emixfruits from '../../assets/mix-fruits.jpg'
import meatImage from '../../assets/food_8.png' // You'll need to add this image

const ExploreMenu = () => {
  const categories = [
    {
      title: "Vegetables",
      description: "From farm-fresh leafy greens to crisp root vegetables, discover our premium quality local produce.",
      image: veggicard
    },
    {
      title: "Fruits",
      description: "Experience the sweetness of nature with our handpicked seasonal fruits.",
      image: mixfruits
    },
    {
      title: "Exotic Vegetables",
      description: "Discover rare and unique vegetables from around the world for your culinary adventures.",
      image: exoticveggi
    },
    {
      title: "Exotic Fruits",
      description: "Explore our collection of exotic fruits from across the globe.",
      image: emixfruits
    },
    {
      title: "Meat",
      description: "Premium quality, fresh meat products sourced from trusted suppliers.",
      image: meatImage
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
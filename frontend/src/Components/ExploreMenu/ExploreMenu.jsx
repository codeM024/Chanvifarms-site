import './ExploreMenu.css'
import ImageLoader from './ImageLoader'
import Reveal from '../Motion/Reveal'
import exoticveggi from '../../assets/exoticveggicard.webp'
import veggicard from '../../assets/veggicard.webp'
import mixfruits from '../../assets/mixfru.webp'
import emixfruits from '../../assets/mix-fruits.webp'
import groceries from '../../assets/grocriess.webp'

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
    <section className="explore-menu" id="explore-menu">
      <Reveal className="explore-menu-header">
        <span className="explore-eyebrow">Categories</span>
        <h1>See What We <strong>Provide</strong></h1>
      </Reveal>

      <div className="categories-grid">
        {categories.map((item, index) => (
          <Reveal
            key={item.title}
            className="category-card-wrap"
            delay={Math.min(index * 0.06, 0.3)}
          >
            <div className="category-card">
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
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export default ExploreMenu

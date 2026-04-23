import React from 'react';
import './OrderOfferDetails.css';
import { FaGift, FaPercent, FaTruck, FaCarrot, FaAppleAlt } from 'react-icons/fa';

const OrderOfferDetails = ({ offer }) => {
  if (!offer) return null;

  const getOfferIcon = (type, itemType) => {
    switch (type) {
      case 'percentage':
        return <FaPercent />;
      case 'free_delivery':
        return <FaTruck />;
      case 'free_item':
        switch (itemType) {
          case 'leafy_veggie':
          case 'veggie':
            return <FaCarrot />;
          case 'fruit':
            return <FaAppleAlt />;
          default:
            return <FaGift />;
        }
      default:
        return <FaGift />;
    }
  };

  const renderBenefits = (benefits) => {
    return benefits.map((benefit, index) => (
      <div key={index} className="offer-benefit">
        {getOfferIcon(benefit.type, benefit.itemType)}
        <span>
          {benefit.type === 'percentage' && `${benefit.value}% Off`}
          {benefit.type === 'free_delivery' && 'Free Delivery'}
          {benefit.type === 'free_item' && 
            `Free ${benefit.quantity} ${benefit.itemType.replace('_', ' ')}${benefit.size ? ` (${benefit.size})` : ''}`}
        </span>
      </div>
    ));
  };

  return (
    <div className="order-offer-details">
      <div className="offer-header">
        <FaGift className="offer-icon" />
        <span className="offer-code">{offer.code}</span>
      </div>
      <div className="offer-content">
        {offer.type === 'combo' ? (
          <div className="offer-benefits">
            {renderBenefits(offer.benefits)}
          </div>
        ) : (
          <div className="offer-benefit">
            {getOfferIcon(offer.type, offer.itemType)}
            <span>
              {offer.type === 'percentage' && `${offer.value}% Off`}
              {offer.type === 'free_delivery' && 'Free Delivery'}
              {offer.type === 'free_item' && 
                `Free ${offer.quantity} ${offer.itemType.replace('_', ' ')}${offer.size ? ` (${offer.size})` : ''}`}
            </span>
          </div>
        )}
        {offer.discountAmount > 0 && (
          <div className="discount-amount">
            Discount Applied: ₹{offer.discountAmount.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderOfferDetails;
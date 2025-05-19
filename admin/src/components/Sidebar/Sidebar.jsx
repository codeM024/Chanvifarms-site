import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import {NavLink} from 'react-router-dom'
import { FaList, FaPlus, FaShoppingBag, FaUsers } from 'react-icons/fa'

const Sidebar = () => {
  return (
    <div className="sidebar">
        <div className="sidebar-options">
            <NavLink to='/add' className="sidebar-option">
                <FaPlus className="icon" />
                <p>Add Items</p>
            </NavLink>
            <NavLink to='/list' className="sidebar-option">
                <FaList className="icon" />
                <p>List Items</p>
            </NavLink>
            <NavLink to='/orders' className="sidebar-option">
                <FaShoppingBag className="icon" />
                <p>Orders</p>
            </NavLink>
        </div>
    
    </div>
  )
}

export default Sidebar
'use client';

import Image from 'next/image';
import './globals.css';
import { Box, Container, Typography, TableBody, TextField, Button, InputAdornment, IconButton, Table, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LinkIcon from '@mui/icons-material/Link';
import { Select, MenuItem } from '@mui/material';


export default function Home() {
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [image, setImage] = useState('');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [filteredItems, setFilteredItems] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterExpirationDate, setFilterExpirationDate] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [capturedImage, setCapturedImage] = useState('');
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [showCamera, setShowCamera] = useState(false); 
  const [uniqueCategories, setUniqueCategories] = useState([]);


  const handleAddItem = async () => {
    if (item.trim() && quantity.trim() && category.trim() && expirationDate.trim()) {
      try {
        const querySnapshot = await getDocs(collection(db, 'pantryItems'));
        const itemsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
  
        const existingItem = itemsList.find(doc => doc.name === item);
  
        if (existingItem) {
          const existingData = existingItem;
          const newQuantity = parseInt(existingData.quantity) + parseInt(quantity);
  
          const existingExpirationDate = new Date(existingData.expirationDate);
          const newExpirationDate = new Date(expirationDate);
  
          let finalExpirationDate;
          if (existingExpirationDate < newExpirationDate) {
            finalExpirationDate = existingExpirationDate;
          } else {
            finalExpirationDate = newExpirationDate;
          }
  
          const proceed = window.confirm(
            `Item "${item}" already exists with quantity ${existingData.quantity} and expiration date ${existingData.expirationDate}. Do you want to update the quantity to ${newQuantity} and expiration date to ${finalExpirationDate.toISOString().split('T')[0]}?`
          );
  
          if (proceed) {
            await updateDoc(doc(db, 'pantryItems', existingItem.id), {
              quantity: newQuantity.toString(),
              expirationDate: finalExpirationDate.toISOString().split('T')[0]
            });
            alert('Quantity and expiration date updated successfully!');
          }
        } else {
          await addDoc(collection(db, 'pantryItems'), {
            name: item,
            quantity,
            category,
            expirationDate,
            image
          });
          alert('Item added successfully!');
        }
  
        fetchItems();
        setItem('');
        setQuantity('');
        setCategory('');
        setExpirationDate('');
        setImage('');
      } catch (error) {
        console.error('Error adding or updating item: ', error);
      }
    } else {
      alert('Please fill out all fields.');
    }
  };

  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'pantryItems'));
      const itemsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsList);
  
      const categories = [...new Set(itemsList.map(item => item.category))];
      setUniqueCategories(categories);
    } catch (error) {
      console.error('Error fetching items: ', error);
    }
  };
  

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
  
    const filtered = items.filter(item => {
      const itemName = item.name ? item.name.toLowerCase() : '';
      const itemCategory = item.category ? item.category.toLowerCase() : '';
      const itemExpirationDate = item.expirationDate ? item.expirationDate : '';
  
      return (
        itemName.includes(lowercasedQuery) &&
        itemCategory.includes(filterCategory.toLowerCase()) &&
        (filterExpirationDate ? itemExpirationDate === filterExpirationDate : true)
      );
    });
  
    setFilteredItems(filtered);
  }, [searchQuery, filterCategory, filterExpirationDate, items]);

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteDoc(doc(db, 'pantryItems', id));
        fetchItems();
      } catch (error) {
        console.error('Error deleting item: ', error);
      }
    }
  };

  const renderImage = (src) => {
    if (src.startsWith('data:')) {
      return <img src={src} alt="Item Image" style={{ maxWidth: '100px' }} />;
    } else {
      return <Image src={src} alt="Item Image" width={100} height={100} objectFit="contain" />;
    }
  };

  const handleUpdateItem = async (id) => {
    const itemToEdit = items.find(item => item.id === id);
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setItem(itemToEdit.name);
      setQuantity(itemToEdit.quantity);
      setCategory(itemToEdit.category);
      setExpirationDate(itemToEdit.expirationDate);
      setImage(itemToEdit.image);
    }
  };

  const handleSaveUpdate = async () => {
    if (item.trim() && quantity.trim() && category.trim() && expirationDate.trim()) {
      try {
        await updateDoc(doc(db, 'pantryItems', editingItem.id), {
          name: item,
          quantity,
          category,
          expirationDate,
          image
        });
        fetchItems();
        setItem('');
        setQuantity('');
        setCategory('');
        setExpirationDate('');
        setImage('');
        setEditingItem(null);
        alert('Item updated successfully!');
      } catch (error) {
        console.error('Error updating item: ', error);
      }
    } else {
      alert('Please fill out all fields.');
    }
  };

  const handleOpenImageDialog = () => {
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop()); 
    }
    setShowCamera(false); 
    setOpenImageDialog(false);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    handleCloseImageDialog();
  };

  const handleImageUrlChange = () => {
    if (imageUrl) {
      setImage(imageUrl);
    }
    handleCloseImageDialog();
  };

  const handleCaptureImage = () => {
    if (showCamera) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        setCapturedImage(canvas.toDataURL('image/png'));
        setImage(canvas.toDataURL('image/png'));
        handleCloseImageDialog(); 
      }
    } else {
      setShowCamera(true); 
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(error => console.error('Error accessing camera: ', error));
    }
  };

  return (
    <main>
      <Container>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 2 
          }}
        >
          <Typography variant="h5">Welcome to the Pantry App</Typography>
          <Box>
            <a
              href=""
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              By
              <Image
                src="/darklogo.png"
                alt="Vercel Logo"
                width={100}
                height={90}
                priority
              />
            </a>
          </Box>
        </Box>
        <Box
            sx={{
              position: 'relative',
              textAlign: 'center',
              mb: 2,
              mt: 2,
              width: '200px', 
              height: '200px', 
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mx: 'auto' 
            }}
          >
            <Image src="/DonateFood.png" alt="Pantry App" layout="fill" objectFit="contain" />
            <Typography
              variant="h4"
              sx={{
                position: 'absolute',
                color: 'black', 
                fontWeight: 'bold',
                textShadow: '2px 2px 6px rgba(0, 0, 0, 0.5)' 
              }}
            >
              Pantry App
            </Typography>
          </Box>



        <Divider sx={{ marginY: 2 }} />

        <Box sx={{ marginTop: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="subtitle1" sx={{ marginBottom: 1,marginTop: 1, fontWeight: 'bold' }}>Add Item</Typography>
            <TextField
              id="item-name"
              fullWidth
              variant="outlined"
              placeholder="Enter item name"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
            <Typography variant="subtitle1" sx={{ marginBottom: 1, marginTop: 1, fontWeight: 'bold' }}>Quantity</Typography>
            <TextField
              id="quantity"
              fullWidth
              variant="outlined"
              placeholder="Enter quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Typography variant="subtitle1" sx={{ marginBottom: 1,marginTop: 1,  fontWeight: 'bold' }}>Category</Typography>
            <TextField
              id="item-category"
              fullWidth
              variant="outlined"
              placeholder="Enter category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <Typography variant="subtitle1" sx={{ marginBottom: 1, marginTop: 1, fontWeight: 'bold' }}>Expiration Date</Typography>
            <TextField
              id="expiration-date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
            />
            {/* <Button variant="contained" component="label" onClick={handleOpenImageDialog}>
                Upload Image
            </Button> */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
              <Button variant="contained" component="label" onClick={handleOpenImageDialog} startIcon={<FileUploadIcon />}>
                Upload Image
                <input type="file" hidden onChange={handleImageUpload} />
                <IconButton onClick={handleCaptureImage} sx={{ ml: 2 }}>
                  <CameraAltIcon />
                </IconButton>
              </Button>
            </Box>

            {/* <Typography variant="subtitle1" sx={{ marginBottom: 1, fontWeight: 'bold' }}>Image URL</Typography>
            <TextField
              id="image-url"
              fullWidth
              variant="outlined"
              placeholder="Enter image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" sx={{ p: 0, marginRight: 1 }} onClick={handleOpenImageDialog}>
                      <CameraAltIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            /> */}
            <Button variant="contained" sx={{ marginTop: 1 }} onClick={editingItem ? handleSaveUpdate : handleAddItem}>
              {editingItem ? 'Save Changes' : 'Add'}
            </Button>
          </div>
        </Box>

        <Divider sx={{ marginY: 2 }} />

        <Typography variant="h6">What&#39;s in My Pantry</Typography>
        <Box sx={{ marginTop: 2, display: 'flex', gap: 2 }}>
          <div style={{ flex: 1 }}>
            <TextField
              id="search-query"
              fullWidth
              variant="outlined"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <Select
              id="filter-category"
              fullWidth
              variant="outlined"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>All Categories</em>
              </MenuItem>
              {uniqueCategories.map((category, index) => (
                <MenuItem key={index} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </div>

          <div style={{ flex: 1 }}>
            <TextField
              id="filter-expiration-date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              variant="outlined"
              value={filterExpirationDate}
              onChange={(e) => setFilterExpirationDate(e.target.value)}
              placeholder="Expiration Date"
            />
          </div>
        </Box>

        <TableContainer component={Paper} sx={{ marginTop: 2, maxHeight: 400, overflowY: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ position: 'sticky', top: 0, backgroundColor: 'grey', zIndex: 1 }}>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell>Item Image</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Expiration Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{renderImage(item.image)}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.expirationDate}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleUpdateItem(item.id)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteItem(item.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Image Upload Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog} fullWidth maxWidth="sm">
        <DialogTitle>Upload Image</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<FileUploadIcon />}
              onClick={() => document.getElementById('file-input').click()}
            >
              Upload from Computer/Phone
              <input
                id="file-input"
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageUpload}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<LinkIcon />}
              onClick={() => {
                setImageUrl(prompt('Enter the image URL'));
                handleImageUrlChange();
              }}
            >
              Enter Image URL
            </Button>
            <Button
              variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={handleCaptureImage}
            >
              Take Picture
            </Button>
            {capturedImage && (
              <Box sx={{ marginTop: 2 }}>
                <Typography variant="subtitle1">Captured Image</Typography>
                <Image src={capturedImage} alt="Captured" style={{ maxWidth: '100%' }} />
              </Box>
            )}
            {showCamera && ( 
              <Box sx={{ marginTop: 2 }}>
                <video ref={videoRef} style={{ width: '100%', height: 'auto' }}></video>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Close</Button>
          <Button onClick={handleCaptureImage} disabled={!videoRef.current}>Capture</Button>
        </DialogActions>
      </Dialog>
    </main>
  );
}

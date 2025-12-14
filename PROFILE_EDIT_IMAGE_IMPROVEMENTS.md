# Profile Edit Screen - Image Upload UI Improvements

## Overview

Improved the image upload and drag-and-drop interface in the profile edit screen to make images larger, clearer, and more user-friendly.

---

## Changes Made

### 1. ✅ Larger Image Grid

**Before:**
- 3 columns layout
- Images at 31% width
- Very small and cramped

**After:**
- **2 columns layout** for much larger images
- Images at **48% width** (almost half the screen width each)
- More breathing room with better spacing

```typescript
// Grid layout change
numColumns={2}  // Changed from 3

// Image size change
className="w-[48%] aspect-square relative mx-[1%] mb-3"  // Changed from w-[31%]
```

### 2. ✅ Better Image Styling

**Improvements:**
- **Rounded corners** - Changed from `rounded-lg` to `rounded-2xl` for modern look
- **Larger loading indicator** - Changed from `size="small"` to `size="large"`
- **Better remove button** - Larger (4x4 instead of 3x3) and better positioned

```typescript
// Before
className="w-full h-full object-cover rounded-lg"

// After
className="w-full h-full object-cover rounded-2xl"
```

### 3. ✅ Enhanced Empty State

**Before:**
- Plain border with small icon
- No text

**After:**
- **Dashed border** for better visual indication
- **Larger icon** (xl instead of lg)
- **"Add Photo" text** label
- **Background color** for better contrast

```typescript
<Pressable
  onPress={() => pickImage(index)}
  className="w-full h-full rounded-2xl items-center justify-center border-2 border-dashed border-background-200 bg-background-50"
>
  <Icon as={AddIcon} size="xl" className="text-background-400" />
  <Text className="text-background-400 text-sm mt-2 font-roboto">
    Add Photo
  </Text>
</Pressable>
```

### 4. ✅ Improved Labels

**Main Photo Label:**
```typescript
// Before
<Box className="absolute bottom-2 left-2 bg-secondary-500/70 py-1 px-2 rounded-full">
  <Text className="text-secondary-800 text-2xs">Main</Text>
</Box>

// After
<Box className="absolute bottom-3 left-3 bg-primary-500/90 py-1.5 px-3 rounded-full">
  <Text className="text-white text-xs font-medium font-roboto">Main Photo</Text>
</Box>
```

**Photo Number Labels:**
```typescript
// Before
<Box className="absolute bottom-2 left-2 bg-background-50 h-5 w-5 items-center justify-center rounded-full">
  <Text className="text-typography-500 text-2xs">{index + 1}</Text>
</Box>

// After
<Box className="absolute bottom-3 left-3 bg-background-900/80 h-6 w-6 items-center justify-center rounded-full">
  <Text className="text-white text-xs font-medium font-roboto">{index + 1}</Text>
</Box>
```

### 5. ✅ Better Drag Visual Feedback

**Added inline styles for active drag state:**
```typescript
style={{
  opacity: isActive ? 0.7 : 1,
  transform: isActive ? [{ scale: 1.05 }] : [{ scale: 1 }],
}}
```

**Effect:**
- Image becomes slightly transparent when dragging
- Scales up by 5% for better visibility
- Smooth transition between states

### 6. ✅ Enhanced Section Header

**Before:**
```typescript
<Text className="text-typography-950 text-base font-medium mb-1">
  My Photos & Videos
</Text>
```

**After:**
```typescript
<Text className="text-typography-950 text-xl font-bold font-satoshi mb-2">
  My Photos & Videos
</Text>
```

**Changes:**
- Larger text size (xl instead of base)
- Bold instead of medium weight
- Uses Satoshi font for modern look

### 7. ✅ Better Upload Progress UI

**Before:**
- Simple progress bar
- Plain text

**After:**
- **Card-style container** with background
- **Side-by-side layout** for label and percentage
- **Colored percentage** in primary color
- **Better contrast** with padding and rounded corners

```typescript
<VStack className="gap-2 bg-background-50 p-4 rounded-xl">
  <HStack className="justify-between items-center">
    <Text className="text-typography-700 text-sm font-medium font-roboto">
      Uploading images...
    </Text>
    <Text className="text-primary-500 text-sm font-bold font-roboto">
      {uploadProgress}%
    </Text>
  </HStack>
  <Box className="h-2 bg-background-200 rounded-full overflow-hidden">
    <Box
      className="h-full bg-primary-500 rounded-full"
      style={{ width: `${uploadProgress}%` }}
    />
  </Box>
</VStack>
```

### 8. ✅ Improved Info Banner

**Before:**
```typescript
<HStack className="justify-center gap-2 items-center">
  <Icon as={InfoIcon} className="text-typography-500" />
  <Text className="text-typography-500 text-sm font-medium">
    Hold and drag photo to reorder
  </Text>
</HStack>
```

**After:**
```typescript
<HStack className="justify-center gap-2 items-center bg-background-50 py-3 px-4 rounded-lg">
  <Icon as={InfoIcon} className="text-primary-500" size="sm" />
  <Text className="text-typography-600 text-sm font-roboto">
    Hold and drag to reorder your photos
  </Text>
</HStack>
```

**Improvements:**
- Background color for better visibility
- Padding for spacing
- Primary color icon
- Cleaner text

---

## Visual Comparison

### Before (3 columns, 31% width):
```
┌────────────────────────────────┐
│  My Photos & Videos            │
│                                │
│  [img] [img] [img]             │ ← Small
│  [img] [img] [+]               │ ← Cramped
│                                │
│  ℹ Hold and drag photo...     │
└────────────────────────────────┘
```

### After (2 columns, 48% width):
```
┌────────────────────────────────┐
│  My Photos & Videos            │ ← Bigger title
│                                │
│  ┌──────────┐  ┌──────────┐  │
│  │  Image   │  │  Image   │  │ ← Much larger
│  │  Main    │  │    2     │  │
│  └──────────┘  └──────────┘  │
│                                │
│  ┌──────────┐  ┌──────────┐  │
│  │  Image   │  │  Image   │  │
│  │    3     │  │    4     │  │
│  └──────────┘  └──────────┘  │
│                                │
│  ┌──────────┐  ┌──────────┐  │
│  │  Image   │  │ Add Photo│  │ ← Dashed border
│  │    5     │  │    +     │  │ ← with text
│  └──────────┘  └──────────┘  │
│                                │
│  ╭────────────────────────╮   │
│  │ ℹ Hold and drag to...  │   │ ← Card style
│  ╰────────────────────────╯   │
└────────────────────────────────┘
```

---

## Benefits

### User Experience Improvements:

1. **Larger Images**
   - Easier to see photo details
   - Better for photo selection
   - More professional appearance

2. **Clearer Actions**
   - Obvious where to add photos
   - Clear indication of empty slots
   - Better visual hierarchy

3. **Better Feedback**
   - Visual scale and opacity on drag
   - Larger loading indicators
   - Progress percentage visible

4. **Modern Design**
   - Rounded corners (2xl)
   - Better spacing
   - Card-based UI elements
   - Consistent typography

5. **Improved Readability**
   - Larger labels
   - Better contrast
   - White text on dark backgrounds

---

## Technical Details

### Grid Layout

**DraggableFlatList Configuration:**
```typescript
<DraggableFlatList
  data={pictures}
  onDragEnd={handleDragEnd}
  keyExtractor={(item, index) => `picture-${index}`}
  renderItem={renderDraggableItem}
  numColumns={2}              // 2 columns instead of 3
  scrollEnabled={false}       // Disable internal scroll
  containerStyle={{ flexWrap: "wrap" }}
/>
```

### Image Sizing

**Responsive Width Calculation:**
- Container width: 100%
- Image width: 48% (almost half)
- Margins: 1% on each side (2% total)
- Gap between images: ~2%
- Total: 48% + 2% + 48% = 98% (2% left for padding)

**Aspect Ratio:**
- `aspect-square` maintains 1:1 ratio
- Works for all screen sizes
- No fixed heights needed

### Drag Behavior

**Active State:**
```typescript
style={{
  opacity: isActive ? 0.7 : 1,
  transform: isActive ? [{ scale: 1.05 }] : [{ scale: 1 }],
}}
```

**Long Press Activation:**
```typescript
onLongPress={item ? drag : undefined}
disabled={isActive}
```

---

## Files Modified

### [components/screens/profile/edit/index.tsx](components/screens/profile/edit/index.tsx)

**Lines Changed:**
- 310-385: `renderDraggableItem` function
- 436-474: Photo section layout

**Key Changes:**
1. Changed width from `w-[31%]` to `w-[48%]`
2. Changed `numColumns={3}` to `numColumns={2}`
3. Changed border radius from `rounded-lg` to `rounded-2xl`
4. Enhanced empty state with dashed border and text
5. Improved labels with better sizing and colors
6. Added drag visual feedback
7. Enhanced upload progress UI
8. Improved section header and info banner

---

## Testing Checklist

### Image Display
- [ ] Images are significantly larger
- [ ] 2 images per row (2 columns)
- [ ] Images have rounded corners (2xl)
- [ ] Images load with large spinner
- [ ] Main photo has "Main Photo" label
- [ ] Other photos have number badges

### Empty States
- [ ] Empty slots show dashed border
- [ ] "Add Photo" text is visible
- [ ] Plus icon is larger
- [ ] Background color visible
- [ ] Tap opens image picker

### Drag & Drop
- [ ] Long press activates drag
- [ ] Image scales up when dragging
- [ ] Image becomes semi-transparent
- [ ] Can reorder photos
- [ ] Order saves correctly

### Upload Progress
- [ ] Progress bar shows in card style
- [ ] Percentage displayed in color
- [ ] Bar fills from left to right
- [ ] Completes at 100%

### Responsiveness
- [ ] Works on small phones
- [ ] Works on large phones
- [ ] Works on tablets
- [ ] Images maintain aspect ratio

---

## Future Enhancements

### 1. Add Photo Captions

```typescript
{item && (
  <Input className="mt-2" size="sm">
    <InputField
      placeholder="Add caption..."
      value={captions[index]}
      onChangeText={(text) => updateCaption(index, text)}
    />
  </Input>
)}
```

### 2. Crop Editor

```typescript
const editImage = async (index: number) => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,  // Built-in crop editor
    aspect: [1, 1],
  });
};
```

### 3. Filter Preview

```typescript
const filters = ['Original', 'B&W', 'Sepia', 'Warm', 'Cool'];

<HStack className="gap-2 mt-2">
  {filters.map(filter => (
    <Button onPress={() => applyFilter(index, filter)}>
      <ButtonText>{filter}</ButtonText>
    </Button>
  ))}
</HStack>
```

### 4. Batch Upload

```typescript
const pickMultipleImages = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: 6,
  });
};
```

### 5. Photo Guidelines

```typescript
<Alert className="mb-3" variant="info">
  <AlertText>
    📸 Photo tips: Use clear, recent photos with good lighting.
    Show your face in the first photo.
  </AlertText>
</Alert>
```

---

## Summary

✅ **2-column layout** - Images are now 48% width instead of 31%
✅ **Larger images** - Much easier to see and manage
✅ **Better styling** - Rounded corners, better spacing
✅ **Enhanced empty states** - Dashed borders with "Add Photo" text
✅ **Improved labels** - "Main Photo" label, numbered badges
✅ **Drag feedback** - Visual scale and opacity changes
✅ **Modern UI** - Card-style elements, better typography
✅ **Better upload progress** - Percentage display, colored bar

The profile edit image UI is now much more user-friendly and visually appealing! 📸✨

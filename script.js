// Meng-handle event click pada tombol dengan class 'encode' atau 'decode'
$('button.encode, button.decode').click(function(event) {
  event.preventDefault(); // Mencegah tindakan default saat tombol diklik
});

// Fungsi untuk menampilkan gambar yang akan di-decode
function previewDecodeImage() {
  var file = document.querySelector('input[name=decodeFile]').files[0]; // Mengambil file gambar dari input
  // Memanggil fungsi previewImage dengan parameter file, selector canvas, dan callback untuk menampilkan elemen
  previewImage(file, ".decode canvas", function() {
    $(".decode").fadeIn(); // Memunculkan elemen dengan class 'decode'
  });
}

// Fungsi untuk menampilkan gambar yang akan di-encode
function previewEncodeImage() {
  var file = document.querySelector("input[name=baseFile]").files[0]; // Mengambil file gambar dari input
  $(".images .nulled").hide(); // Menyembunyikan elemen dengan class 'nulled'
  $(".images .message").hide(); // Menyembunyikan elemen dengan class 'message'
  // Memanggil fungsi previewImage dengan parameter file, selector canvas, dan callback untuk menampilkan elemen
  previewImage(file, ".original canvas", function() {
    $(".images .original").fadeIn(); // Memunculkan elemen dengan class 'original'
    $(".images").fadeIn(); // Memunculkan elemen dengan class 'images'
  });
}

// Fungsi untuk menampilkan gambar dalam canvas
function previewImage(file, canvasSelector, callback) {
  var reader = new FileReader(); // Membuat objek FileReader
  var image = new Image; // Membuat objek gambar
  var $canvas = $(canvasSelector); // Memilih elemen canvas dengan selector
  var context = $canvas[0].getContext('2d'); // Mendapatkan konteks 2D dari canvas

  if (file) {
    reader.readAsDataURL(file); // Membaca file sebagai URL data
  }

  reader.onloadend = function () { // Menangani saat pembacaan file selesai
    image.src = URL.createObjectURL(file); // Mengatur sumber gambar sebagai URL objek file

    image.onload = function() { // Menangani saat gambar selesai dimuat
      $canvas.prop({ // Mengatur properti canvas
        'width': image.width,
        'height': image.height
      });

      context.drawImage(image, 0, 0); // Menggambar gambar pada canvas

      callback(); // Memanggil callback
    }
  }
}

// Fungsi untuk meng-encode pesan dalam gambar
function encodeMessage() {
  $(".error").hide(); // Menyembunyikan elemen dengan class 'error'
  $(".binary").hide(); // Menyembunyikan elemen dengan class 'binary'

  var text = $("textarea#floatingTextarea2").val(); // Mengambil teks dari textarea

  // Mendapatkan elemen canvas yang digunakan
  var $originalCanvas = $('.original canvas');
  var $nulledCanvas = $('.nulled canvas');
  var $messageCanvas = $('.message canvas');

  // Mendapatkan konteks 2D dari masing-masing canvas
  var originalContext = $originalCanvas[0].getContext("2d");
  var nulledContext = $nulledCanvas[0].getContext("2d");
  var messageContext = $messageCanvas[0].getContext("2d");

  var width = $originalCanvas[0].width; // Mendapatkan lebar canvas
  var height = $originalCanvas[0].height; // Mendapatkan tinggi canvas

  // Memeriksa apakah gambar cukup besar untuk menyembunyikan pesan
  if ((text.length * 8) > (width * height * 3)) {
    $(".error")
      .text("Text too long for chosen image....") // Menetapkan teks pesan kesalahan
      .fadeIn(); // Memunculkan elemen dengan class 'error'

    return;
  }

  // Mengatur ulang ukuran canvas
  $nulledCanvas.prop({
    'width': width,
    'height': height
  });

  $messageCanvas.prop({
    'width': width,
    'height': height
  });

  // Normalisasi gambar asli dan menggambarnya
  var original = originalContext.getImageData(0, 0, width, height); // Mendapatkan data gambar asli
  var pixel = original.data; // Mendapatkan data piksel gambar
  for (var i = 0, n = pixel.length; i < n; i += 4) { // Looping melalui data piksel
    for (var offset =0; offset < 3; offset ++) { // Looping melalui komponen warna RGB
      if(pixel[i + offset] %2 != 0) { // Jika nilai piksel ganjil, membuatnya menjadi genap
        pixel[i + offset]--;
      }
    }
  }
  nulledContext.putImageData(original, 0, 0); // Menggambar gambar asli yang sudah dinormalisasi

  // Mengonversi pesan menjadi string biner
  var binaryMessage = "";
  for (i = 0; i < text.length; i++) {
    var binaryChar = text[i].charCodeAt(0).toString(2); // Mengonversi karakter menjadi biner

    // Padding dengan 0 hingga panjang binaryChar menjadi 8 (1 Byte)
    while(binaryChar.length < 8) {
      binaryChar = "0" + binaryChar;
    }

    binaryMessage += binaryChar;
  }
  $('.binary textarea').text(binaryMessage); // Menetapkan teks pada textarea dengan string biner pesan

  // Menerapkan string biner pada gambar dan menggambar gambar tersebut
  var message = nulledContext.getImageData(0, 0, width, height); // Mendapatkan data gambar yang sudah dinormalisasi
  pixel = message.data; // Mendapatkan data piksel gambar
  counter = 0;
  for (var i = 0, n = pixel.length; i < n; i += 4) { // Looping melalui data piksel
    for (var offset =0; offset < 3; offset ++) { // Looping melalui komponen warna RGB
      if (counter < binaryMessage.length) {
        pixel[i + offset] += parseInt(binaryMessage[counter]); // Menambahkan nilai biner pesan pada komponen warna
        counter++;
      }
      else {
        break;
      }
    }
  }
  messageContext.putImageData(message, 0, 0); // Menggambar gambar dengan pesan tersembunyi

  // Memunculkan elemen-elemen yang dibutuhkan
  $(".binary").fadeIn();
  $(".images .nulled").fadeIn();
  $(".images .message").fadeIn();
};

// Fungsi untuk mendecode pesan dari gambar
function decodeMessage() {
  $(".binary-decode").hide(); // Menyembunyikan elemen dengan class 'binary-decode' jika ada dari pemanggilan sebelumnya

  var file = document.querySelector('input[name=decodeFile]').files[0]; // Mendapatkan file gambar yang diunggah
  if (!file) {
    alert("Please upload an image file first."); // Peringatan jika tidak ada file gambar yang diunggah
    return;
  }

  var reader = new FileReader(); // Membuat objek FileReader
  var image = new Image(); // Membuat objek gambar

  reader.onloadend = function () { // Menangani saat pembacaan file selesai
    image.src = reader.result; // Mengatur sumber gambar sebagai hasil pembacaan

    image.onload = function() { // Menangani saat gambar selesai dimuat
      var canvas = document.createElement('canvas'); // Membuat elemen canvas baru
      var context = canvas.getContext('2d'); // Mendapatkan konteks 2D dari canvas

      canvas.width = image.width; // Mengatur lebar canvas sesuai lebar gambar
      canvas.height = image.height; // Mengatur tinggi canvas sesuai tinggi gambar
      context.drawImage(image, 0, 0); // Menggambar gambar pada canvas

      var imageData = context.getImageData(0, 0, canvas.width, canvas.height); // Mendapatkan data gambar dari canvas
      var binaryMessage = ""; // Inisialisasi string biner untuk menyimpan pesan tersembunyi

      for (var i = 0; i < imageData.data.length; i += 4) { // Looping melalui data piksel gambar
        for (var j = 0; j < 3; j++) { // Looping melalui komponen warna RGB
          var value = imageData.data[i + j] & 1; // Mengambil bit terakhir dari setiap komponen warna

          binaryMessage += value; // Menambahkan nilai bit ke dalam string biner pesan
        }
      }

      var output = ""; // Inisialisasi output untuk menyimpan pesan yang didekode

      for (var i = 0; i < binaryMessage.length; i += 8) { // Looping melalui string biner pesan
        var charCode = parseInt(binaryMessage.substr(i, 8), 2); // Mengubah setiap 8 bit menjadi angka desimal
        output += String.fromCharCode(charCode); // Mengkonversi angka desimal menjadi karakter dan menambahkannya ke output
      }

      $('.binary-decode textarea').text(output); // Menetapkan teks pada textarea untuk menampilkan pesan yang didekode
      $('.binary-decode').fadeIn(); // Memunculkan div untuk menampilkan pesan yang didekode
    }
  };

  reader.readAsDataURL(file); // Membaca file sebagai URL data
};

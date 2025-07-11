// AEGIS Website - Main JavaScript

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Immediately make all sections visible
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('fade-in', 'active');
    });
    
    // Navigation menu toggle for mobile
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking on a link
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });
    
    // FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Close all other FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle active class for clicked item
            item.classList.toggle('active');
        });
    });
    
    // Scroll animations
    const fadeElements = document.querySelectorAll('.fade-in');
    
    // Add 'fade-in' class to elements that should animate on scroll
    // const sections = document.querySelectorAll('section'); // This line is removed as per new_code
    // sections.forEach(section => { // This line is removed as per new_code
    //     section.classList.add('fade-in'); // This line is removed as per new_code
    // }); // This line is removed as per new_code
    
    // Function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight * 0.75) &&
            rect.bottom >= 0
        );
    }
    
    // Function to handle scroll animation
    function handleScrollAnimation() {
        fadeElements.forEach(element => {
            if (isInViewport(element)) {
                element.classList.add('active');
            }
        });
    }
    
    // Initial check for elements in viewport
    handleScrollAnimation();
    
    // Check for elements on scroll
    window.addEventListener('scroll', handleScrollAnimation);
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Calculate header height for offset
                const headerHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Sticky header on scroll
    const header = document.querySelector('.navbar');
    let scrollPosition = window.scrollY;
    
    function updateHeaderStyle() {
        scrollPosition = window.scrollY;
        
        if (scrollPosition > 100) {
            header.style.padding = '10px 0';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '20px 0';
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
        }
    }
    
    window.addEventListener('scroll', updateHeaderStyle);
    
    // Form submission handling with validation
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Basic form validation
            let isValid = true;
            const formElements = contactForm.elements;
            
            for (let i = 0; i < formElements.length; i++) {
                if (formElements[i].hasAttribute('required') && !formElements[i].value) {
                    isValid = false;
                    formElements[i].style.borderColor = 'var(--danger)';
                } else if (formElements[i].type === 'email' && formElements[i].value) {
                    // Simple email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formElements[i].value)) {
                        isValid = false;
                        formElements[i].style.borderColor = 'var(--danger)';
                    } else {
                        formElements[i].style.borderColor = 'var(--light-gray)';
                    }
                } else {
                    formElements[i].style.borderColor = 'var(--light-gray)';
                }
            }
            
            if (isValid) {
                // Normally we would submit the form to a server here
                // For demonstration, we'll just show an alert
                alert('Form submitted successfully! We will contact you soon.');
                contactForm.reset();
            } else {
                alert('Please fill in all required fields correctly.');
            }
        });
    }
}); 